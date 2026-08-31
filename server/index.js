import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// ============================================================
// ENV
// ============================================================

dotenv.config({
  path: new URL("../.env", import.meta.url),
});

const PORT = process.env.PORT || 3001;

const JWT_SECRET =
  process.env.JWT_SECRET || "medico-secret-key-2025";

// ============================================================
// APP
// ============================================================

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ============================================================
// MYSQL POOL
// ============================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 10000,

  charset: "utf8mb4",
});

// ============================================================
// MYSQL CONNECTION TEST
// ============================================================

async function testConnection() {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.query(
      "SELECT DATABASE() AS database_name"
    );

    console.log("==========================================");
    console.log("MySQL connected successfully");
    console.log("Database:", rows[0]?.database_name);
    console.log("Host:", process.env.DB_HOST);
    console.log("==========================================");

    connection.release();
  } catch (error) {
    console.error("==========================================");
    console.error("MYSQL CONNECTION FAILED");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("==========================================");
  }
}

testConnection();

// ============================================================
// AUDIT LOG HELPERS
// ============================================================

async function logAudit(pool, {
  userId,
  userEmail,
  userName,
  action,
  tableName,
  recordId,
  description,
  oldValues,
  newValues,
  ipAddress,
}) {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs
      (user_id, user_email, user_name, action, table_name, record_id, description, old_values, new_values, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId || null,
        userEmail || null,
        userName || null,
        action,
        tableName,
        String(recordId || ""),
        description,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
      ]
    );
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }
}

async function fetchRecord(pool, table, idColumn, idValue) {
  try {
    const [[row]] = await pool.query(
      `SELECT * FROM ${table} WHERE ${idColumn} = ? LIMIT 1`,
      [idValue]
    );
    return row || null;
  } catch {
    return null;
  }
}

function buildChangeDescription(action, tableName, record, oldVals, newVals) {
  const names = {
    users: "user",
    roles: "role",
    views: "view",
    role_permissions: "permission",
  };
  const entityName = names[tableName] || tableName;

  if (action === "CREATE") {
    if (tableName === "users") return `Created ${entityName} '${newVals.name || newVals.email}' (${newVals.email})`;
    if (tableName === "roles") return `Created ${entityName} '${newVals.role_name}'`;
    if (tableName === "views") return `Created ${entityName} '${newVals.view_name}' in module '${newVals.module_name}' at '${newVals.view_url}'`;
    if (tableName === "role_permissions") return `Granted permissions on view_id=${newVals.view_id} to role_id=${newVals.role_id}`;
    return `Created ${entityName}`;
  }

  if (action === "DELETE") {
    if (tableName === "users") return `Deleted ${entityName} '${oldVals.name || oldVals.email}' (${oldVals.email})`;
    if (tableName === "roles") return `Deleted ${entityName} '${oldVals.role_name}'`;
    if (tableName === "views") return `Deleted ${entityName} '${oldVals.view_name}' from module '${oldVals.module_name}'`;
    if (tableName === "role_permissions") return `Removed permissions on view_id=${oldVals.view_id} for role_id=${oldVals.role_id}`;
    return `Deleted ${entityName}`;
  }

  if (action === "UPDATE") {
    const changes = [];
    if (oldVals && newVals) {
      for (const key of Object.keys(newVals)) {
        if (String(oldVals[key]) !== String(newVals[key])) {
          changes.push(key.replace(/_/g, " "));
        }
      }
    }
    const changeStr = changes.length > 0 ? ` - changed: ${changes.join(", ")}` : "";
    if (tableName === "users") return `Updated ${entityName} '${newVals.name || newVals.email}'${changeStr}`;
    if (tableName === "roles") return `Updated ${entityName} '${newVals.role_name}'${changeStr}`;
    if (tableName === "views") return `Updated ${entityName} '${newVals.view_name}'${changeStr}`;
    if (tableName === "role_permissions") return `Updated permissions for role_id=${newVals.role_id} on view_id=${newVals.view_id}${changeStr}`;
    return `Updated ${entityName}${changeStr}`;
  }

  return `${action} on ${tableName}`;
}

// ============================================================
// BASIC HEALTH CHECK
// ============================================================

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT DATABASE() AS database_name"
    );

    res.json({
      success: true,
      message: "Backend and MySQL are working",
      database: rows[0]?.database_name,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "MySQL connection failed",
      error: error.message,
    });
  }
});

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "No authorization header",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Invalid authorization format",
    });
  }

  const token = authHeader.substring(7);

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
}

// ============================================================
// LOGIN (collegeerp: email + password_hash + role_id)
// ============================================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    const [[user]] = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.name AS full_name,
        u.password_hash AS password,
        CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status,
        u.role_id,
        u.branch_id,
        r.role_name AS roles,
        r.id AS role_ids
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.email = ?
      `,
      [email]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        error: "User account is inactive",
      });
    }

    // --------------------------------------------------------
    // PASSWORD CHECK
    // --------------------------------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // --------------------------------------------------------
    // JWT
    // --------------------------------------------------------

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        roles: user.roles ? [user.roles] : [],
        role_ids: user.role_ids ? [String(user.role_ids)] : [],
        branch_id: user.branch_id,
      },
      JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    // Never return password
    delete user.password;

    res.json({
      success: true,

      user: {
        ...user,
        username: user.email,
        roles: user.roles ? [user.roles] : [],
        role_ids: user.role_ids ? [String(user.role_ids)] : [],
        role_id: user.role_ids || "",
      },

      token,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ALL ROUTES BELOW REQUIRE LOGIN
// ============================================================

app.use(authMiddleware);

// ============================================================
// CURRENT USER (collegeerp schema)
// ============================================================

app.get("/api/auth/me", async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `
      SELECT
        u.id,
        u.email,
        u.name AS full_name,
        CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status,
        u.role_id,
        u.branch_id,
        r.role_name AS roles,
        r.id AS role_ids
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      `,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        ...user,
        username: user.email,
        roles: user.roles ? [user.roles] : [],
        role_ids: user.role_ids ? [String(user.role_ids)] : [],
        role_id: user.role_ids || "",
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ============================================================
// USERS (collegeerp: users + roles, no user_roles junction)
// ============================================================
// ============================================================

// ============================================================
// GET ALL USERS
// ============================================================

app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.email AS username,
        u.name AS full_name,
        u.email,
        CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status,
        u.role_id,
        u.branch_id,
        u.phone,
        r.role_name AS roles,
        r.id AS role_ids
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);

    const users = rows.map((user) => {
      const roleIds = user.role_ids
        ? [String(user.role_ids)]
        : [];

      const roleNames = user.roles
        ? [user.roles]
        : [];

      return {
        ...user,

        roles: roleNames,

        role_ids: roleIds,

        role_id: roleIds[0] || "",
      };
    });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET /api/users ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET SINGLE USER
// ============================================================

app.get("/api/users/:id", async (req, res) => {
  try {
    const [[user]] = await pool.query(
      `
      SELECT
        u.id,
        u.email AS username,
        u.name AS full_name,
        u.email,
        CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status,
        u.role_id,
        u.branch_id,
        u.phone,
        r.role_name AS roles,
        r.id AS role_ids
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
      `,
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const roleIds = user.role_ids
      ? [String(user.role_ids)]
      : [];

    const roleNames = user.roles
      ? [user.roles]
      : [];

    res.json({
      success: true,
      user: {
        ...user,
        roles: roleNames,
        role_ids: roleIds,
        role_id: roleIds[0] || "",
      },
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// CREATE USER (collegeerp: name, email, password_hash, role_id)
// ============================================================

app.post("/api/users", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const {
      id,
      username,
      email,
      full_name,
      password,
      status,
      role_id,
      branch_id,
    } = req.body;

    const userEmail = email || username;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // --------------------------------------------------------
    // CHECK USER ID
    // --------------------------------------------------------

    const [[idExists]] = await connection.query(
      "SELECT id FROM users WHERE id = ?",
      [id]
    );

    if (idExists) {
      return res.status(400).json({
        success: false,
        error: "User ID already exists",
      });
    }

    // --------------------------------------------------------
    // CHECK EMAIL
    // --------------------------------------------------------

    const [[emailExists]] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [userEmail]
    );

    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    // --------------------------------------------------------
    // CHECK ROLE
    // --------------------------------------------------------

    if (role_id) {
      const [[role]] = await connection.query(
        "SELECT id FROM roles WHERE id = ?",
        [role_id]
      );

      if (!role) {
        return res.status(400).json({
          success: false,
          error: "Selected role not found",
        });
      }
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // --------------------------------------------------------
    // INSERT USER (collegeerp: no user_roles, role_id on users)
    // --------------------------------------------------------

    await connection.query(
      `
      INSERT INTO users
      (
        id,
        name,
        email,
        password_hash,
        role_id,
        branch_id,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        full_name || null,
        userEmail,
        hashedPassword,
        role_id || null,
        branch_id || null,
        status === "Inactive" ? 0 : 1,
      ]
    );

    // AUDIT LOG
    const [[newUser]] = await connection.query("SELECT * FROM users WHERE id = ?", [id]);
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "CREATE",
      tableName: "users",
      recordId: id,
      description: buildChangeDescription("CREATE", "users", newUser, null, newUser),
      oldValues: null,
      newValues: { id, name: full_name, email: userEmail, role_id, branch_id, is_active: status === "Inactive" ? 0 : 1 },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user_id: id,
    });
  } catch (error) {
    console.error("POST /api/users ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// ============================================================
// UPDATE USER (collegeerp schema)
// ============================================================

app.put("/api/users/:id", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.params.id;

    const {
      username,
      email,
      full_name,
      password,
      status,
      role_id,
      branch_id,
    } = req.body;

    const userEmail = email || username;

    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters",
        });
      }
    }

    // --------------------------------------------------------
    // GET CURRENT USER
    // --------------------------------------------------------

    const [[currentUser]] = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const oldUserValues = {
      name: currentUser.name,
      email: currentUser.email,
      role_id: currentUser.role_id,
      branch_id: currentUser.branch_id,
      is_active: currentUser.is_active,
    };

    // --------------------------------------------------------
    // DUPLICATE EMAIL
    // --------------------------------------------------------

    const [[duplicate]] = await connection.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [userEmail, userId]
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: "Email already exists",
      });
    }

    // --------------------------------------------------------
    // CHECK ROLE
    // --------------------------------------------------------

    if (role_id !== undefined && role_id !== "") {
      const [[role]] = await connection.query(
        "SELECT id FROM roles WHERE id = ?",
        [role_id]
      );

      if (!role) {
        return res.status(400).json({
          success: false,
          error: "Selected role not found",
        });
      }
    }

    await connection.beginTransaction();

    // --------------------------------------------------------
    // UPDATE USER (collegeerp: name, email, role_id, is_active)
    // --------------------------------------------------------

    await connection.query(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        role_id = ?,
        branch_id = ?,
        is_active = ?
      WHERE id = ?
      `,
      [
        full_name || null,
        userEmail,
        role_id || null,
        branch_id || null,
        status === "Inactive" ? 0 : 1,
        userId,
      ]
    );

    // --------------------------------------------------------
    // UPDATE PASSWORD (if provided)
    // --------------------------------------------------------

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 12);

      await connection.query(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [hashedPassword, userId]
      );
    }

    await connection.commit();

    // AUDIT LOG
    const newUserValues = {
      name: full_name,
      email: userEmail,
      role_id: role_id || null,
      branch_id: branch_id || null,
      is_active: status === "Inactive" ? 0 : 1,
    };
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "UPDATE",
      tableName: "users",
      recordId: userId,
      description: buildChangeDescription("UPDATE", "users", currentUser, oldUserValues, newUserValues) + (password && password.trim() ? " (password was reset)" : ""),
      oldValues: oldUserValues,
      newValues: newUserValues,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("PUT /api/users/:id ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// ============================================================
// DELETE USER (collegeerp: no user_roles to clean)
// ============================================================

app.delete("/api/users/:id", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const userId = req.params.id;

    const [[user]] = await connection.query(
      "SELECT u.*, r.role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Protect Super Admin user (role_id = 1 or role_name = 'Super Admin')
    const [[userInfo]] = await connection.query(
      "SELECT u.id, r.role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?",
      [userId]
    );

    if (userInfo && String(userInfo.role_name).toLowerCase() === "super admin") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete Super Admin user",
      });
    }

    // Check linked data — prevent delete if user is referenced elsewhere
    const linkedChecks = [];

    const [[asStudent]] = await connection.query("SELECT id FROM students WHERE user_id = ? LIMIT 1", [userId]);
    if (asStudent) linkedChecks.push("student record");

    const [[asFaculty]] = await connection.query("SELECT id FROM faculty WHERE user_id = ? LIMIT 1", [userId]);
    if (asFaculty) linkedChecks.push("faculty record");

    const [[asHod]] = await connection.query("SELECT id FROM branches WHERE hod_id = ? LIMIT 1", [userId]);
    if (asHod) linkedChecks.push("branch HOD assignment");

    const [[asMentor]] = await connection.query("SELECT id FROM students WHERE mentor_id = ? LIMIT 1", [userId]);
    if (asMentor) linkedChecks.push("student mentor assignment");

    if (linkedChecks.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete user: linked to ${linkedChecks.join(", ")}. Remove the linked data first.`,
      });
    }

    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    await connection.commit();

    // AUDIT LOG
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "DELETE",
      tableName: "users",
      recordId: userId,
      description: buildChangeDescription("DELETE", "users", user, { name: user.name, email: user.email, role_name: user.role_name }, null),
      oldValues: { id: user.id, name: user.name, email: user.email, role_id: user.role_id, role_name: user.role_name },
      newValues: null,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("DELETE USER ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// ============================================================
// ============================================================
// ROLES (collegeerp: roles.role_name, no status column)
// ============================================================
// ============================================================

// ============================================================
// GET ALL ROLES
// ============================================================

app.get("/api/roles", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        role_name AS name,
        description,
        'Active' AS status
      FROM roles
      ORDER BY id
    `);

    res.status(200).json({
      success: true,
      roles: rows,
    });
  } catch (error) {
    console.error("GET /api/roles ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET SINGLE ROLE
// ============================================================

app.get("/api/roles/:id", async (req, res) => {
  try {
    const [[role]] = await pool.query(
      `
      SELECT
        id,
        role_name AS name,
        description,
        'Active' AS status
      FROM roles
      WHERE id = ?
      `,
      [req.params.id]
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found",
      });
    }

    res.json({
      success: true,
      role,
    });
  } catch (error) {
    console.error("GET ROLE ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// CREATE ROLE (collegeerp: role_name, description)
// ============================================================

app.post("/api/roles", async (req, res) => {
  try {
    const { id, name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Role name is required",
      });
    }

    const [[existsName]] = await pool.query(
      "SELECT id FROM roles WHERE role_name = ?",
      [name]
    );

    if (existsName) {
      return res.status(400).json({
        success: false,
        error: "Role name already exists",
      });
    }

    await pool.query(
      "INSERT INTO roles (role_name, description) VALUES (?, ?)",
      [name, description || null]
    );

    // AUDIT LOG
    const [[newRole]] = await pool.query("SELECT * FROM roles WHERE role_name = ?", [name]);
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "CREATE",
      tableName: "roles",
      recordId: newRole?.id,
      description: buildChangeDescription("CREATE", "roles", newRole, null, { role_name: name, description }),
      oldValues: null,
      newValues: { role_name: name, description },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
    });
  } catch (error) {
    console.error("POST /api/roles ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// UPDATE ROLE (collegeerp: role_name, description)
// ============================================================

app.put("/api/roles/:id", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Role name is required",
      });
    }

    const [[duplicate]] = await pool.query(
      "SELECT id FROM roles WHERE role_name = ? AND id != ?",
      [name, req.params.id]
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: "Role name already exists",
      });
    }

    // Fetch old role for audit
    const [[oldRole]] = await pool.query("SELECT * FROM roles WHERE id = ?", [req.params.id]);
    const oldValues = oldRole ? { role_name: oldRole.role_name, description: oldRole.description } : null;

    const [result] = await pool.query(
      "UPDATE roles SET role_name = ?, description = ? WHERE id = ?",
      [name, description || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Role not found",
      });
    }

    // AUDIT LOG
    const newValues = { role_name: name, description };
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "UPDATE",
      tableName: "roles",
      recordId: req.params.id,
      description: buildChangeDescription("UPDATE", "roles", oldRole, oldValues, newValues),
      oldValues,
      newValues,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/roles ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// DELETE ROLE (collegeerp: clean role_permissions first)
// ============================================================

app.delete("/api/roles/:id", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const roleId = req.params.id;

    const [[role]] = await connection.query(
      "SELECT * FROM roles WHERE id = ?",
      [roleId]
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        error: "Role not found",
      });
    }

    // Protect Super Admin role
    if (String(role.role_name).toLowerCase() === "super admin") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete Super Admin role",
      });
    }

    // Check linked data — prevent delete if role is referenced elsewhere
    const linkedChecks = [];

    const [[usersWithRole]] = await connection.query("SELECT id FROM users WHERE role_id = ? LIMIT 1", [roleId]);
    if (usersWithRole) linkedChecks.push("assigned users");

    const [[permsWithRole]] = await connection.query("SELECT id FROM role_permissions WHERE role_id = ? LIMIT 1", [roleId]);
    if (permsWithRole) linkedChecks.push("permission entries");

    if (linkedChecks.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete role: linked to ${linkedChecks.join(", ")}. Remove the linked data first.`,
      });
    }

    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM roles WHERE id = ?",
      [roleId]
    );

    await connection.commit();

    // AUDIT LOG
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "DELETE",
      tableName: "roles",
      recordId: roleId,
      description: buildChangeDescription("DELETE", "roles", role, { role_name: role.role_name, description: role.description }, null),
      oldValues: { id: role.id, role_name: role.role_name, description: role.description },
      newValues: null,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("DELETE ROLE ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// ============================================================
// ============================================================
// MODULES (VIRTUAL - derived from views.module_name)
// ============================================================
// ============================================================

// ============================================================
// GET MODULES (distinct module_name from views)
// ============================================================

app.get("/api/modules", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        module_name AS name,
        module_name AS id,
        module_name AS description,
        'Active' AS status
      FROM views
      GROUP BY module_name
      ORDER BY module_name
    `);

    res.json({
      success: true,
      modules: rows,
    });
  } catch (error) {
    console.error("GET MODULES ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// CREATE MODULE (virtual - return info)
// ============================================================

app.post("/api/modules", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Modules are managed through Views. Add a new View with a new module_name instead.",
  });
});

// ============================================================
// UPDATE MODULE (virtual - return info)
// ============================================================

app.put("/api/modules/:id", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Modules are derived from Views. Update the module_name on relevant Views instead.",
  });
});

// ============================================================
// DELETE MODULE (virtual - return info)
// ============================================================

app.delete("/api/modules/:id", async (req, res) => {
  res.status(400).json({
    success: false,
    error: "Modules are virtual (derived from views.module_name). Delete or update the views with this module_name instead.",
  });
});

// ============================================================
// ============================================================
// VIEWS (collegeerp: view_name, view_url, module_name)
// ============================================================
// ============================================================

// ============================================================
// GET ALL VIEWS
// ============================================================

app.get("/api/views", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        view_name AS name,
        view_url AS route,
        module_name,
        icon,
        'Active' AS status
      FROM views
      ORDER BY id
    `);

    res.json({
      success: true,
      views: rows,
    });
  } catch (error) {
    console.error("GET VIEWS ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// CREATE VIEW (collegeerp: view_name, view_url, module_name)
// ============================================================

app.post("/api/views", async (req, res) => {
  try {
    const { id, name, route, module_name, icon } = req.body;
    const viewName = name || req.body.view_name;
    const viewUrl = route || req.body.view_url;
    const moduleName = module_name || req.body.module;

    if (!viewName || !viewUrl) {
      return res.status(400).json({
        success: false,
        error: "View name and URL are required",
      });
    }

    if (!moduleName) {
      return res.status(400).json({
        success: false,
        error: "Module name is required",
      });
    }

    await pool.query(
      `
      INSERT INTO views
      (
        view_name,
        view_url,
        module_name,
        icon
      )
      VALUES (?, ?, ?, ?)
      `,
      [viewName, viewUrl, moduleName, icon || null]
    );

    // AUDIT LOG
    const [[newView]] = await pool.query("SELECT * FROM views WHERE view_name = ? AND view_url = ?", [viewName, viewUrl]);
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "CREATE",
      tableName: "views",
      recordId: newView?.id,
      description: buildChangeDescription("CREATE", "views", newView, null, { view_name: viewName, view_url: viewUrl, module_name: moduleName, icon }),
      oldValues: null,
      newValues: { view_name: viewName, view_url: viewUrl, module_name: moduleName, icon },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "View created successfully",
    });
  } catch (error) {
    console.error("POST VIEW ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// UPDATE VIEW (collegeerp schema)
// ============================================================

app.put("/api/views/:id", async (req, res) => {
  try {
    const { name, route, module_name, icon } = req.body;
    const viewName = name || req.body.view_name;
    const viewUrl = route || req.body.view_url;
    const moduleName = module_name || req.body.module;

    if (!viewName || !viewUrl) {
      return res.status(400).json({
        success: false,
        error: "View name and URL are required",
      });
    }

    // Fetch old view for audit
    const [[oldView]] = await pool.query("SELECT * FROM views WHERE id = ?", [req.params.id]);
    const oldValues = oldView ? { view_name: oldView.view_name, view_url: oldView.view_url, module_name: oldView.module_name, icon: oldView.icon } : null;

    const [result] = await pool.query(
      `
      UPDATE views
      SET
        view_name = ?,
        view_url = ?,
        module_name = ?,
        icon = ?
      WHERE id = ?
      `,
      [viewName, viewUrl, moduleName || null, icon || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "View not found",
      });
    }

    // AUDIT LOG
    const newValues = { view_name: viewName, view_url: viewUrl, module_name: moduleName, icon };
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "UPDATE",
      tableName: "views",
      recordId: req.params.id,
      description: buildChangeDescription("UPDATE", "views", oldView, oldValues, newValues),
      oldValues,
      newValues,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "View updated successfully",
    });
  } catch (error) {
    console.error("PUT VIEW ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// DELETE VIEW
// ============================================================

app.delete("/api/views/:id", async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const viewId = req.params.id;

    const [[view]] = await connection.query(
      "SELECT * FROM views WHERE id = ?",
      [viewId]
    );

    if (!view) {
      return res.status(404).json({
        success: false,
        error: "View not found",
      });
    }

    // Check linked data — prevent delete if view is referenced in role_permissions
    const [[permsWithView]] = await connection.query("SELECT id FROM role_permissions WHERE view_id = ? LIMIT 1", [viewId]);
    if (permsWithView) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete view: linked to role permissions. Remove the permission entries first.",
      });
    }

    await connection.beginTransaction();

    await connection.query(
      "DELETE FROM views WHERE id = ?",
      [viewId]
    );

    await connection.commit();

    // AUDIT LOG
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "DELETE",
      tableName: "views",
      recordId: viewId,
      description: buildChangeDescription("DELETE", "views", view, { view_name: view.view_name, view_url: view.view_url, module_name: view.module_name }, null),
      oldValues: { id: view.id, view_name: view.view_name, view_url: view.view_url, module_name: view.module_name, icon: view.icon },
      newValues: null,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "View deleted successfully",
    });
  } catch (error) {
    await connection.rollback();

    console.error("DELETE VIEW ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

// ============================================================
// ============================================================
// PERMISSIONS (collegeerp: role_permissions + views join)
// ============================================================
// ============================================================

// ============================================================
// GET ALL PERMISSIONS (role_permissions + roles + views)
// ============================================================

app.get("/api/permissions", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        rp.id,
        CONCAT(r.role_name, ' - ', v.view_name) AS name,
        v.module_name AS module,
        rp.role_id,
        rp.view_id,
        rp.can_view,
        rp.can_add,
        rp.can_edit,
        rp.can_delete,
        rp.department_scope
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN views v ON rp.view_id = v.id
      ORDER BY r.role_name, v.module_name, v.view_name
    `);

    res.json({
      success: true,
      permissions: rows,
    });
  } catch (error) {
    console.error("GET PERMISSIONS ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// GET SINGLE PERMISSION
// ============================================================

app.get("/api/permissions/:id", async (req, res) => {
  try {
    const [[permission]] = await pool.query(
      `
      SELECT
        rp.id,
        CONCAT(r.role_name, ' - ', v.view_name) AS name,
        v.module_name AS module,
        rp.role_id,
        rp.view_id,
        rp.can_view,
        rp.can_add,
        rp.can_edit,
        rp.can_delete,
        rp.department_scope
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN views v ON rp.view_id = v.id
      WHERE rp.id = ?
      `,
      [req.params.id]
    );

    if (!permission) {
      return res.status(404).json({
        success: false,
        error: "Permission not found",
      });
    }

    res.json({
      success: true,
      permission,
    });
  } catch (error) {
    console.error("GET PERMISSION ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// CREATE PERMISSION (INSERT INTO role_permissions)
// ============================================================

app.post("/api/permissions", async (req, res) => {
  try {
    const {
      role_id,
      view_id,
      can_view,
      can_add,
      can_edit,
      can_delete,
      department_scope,
    } = req.body;

    if (!role_id || !view_id) {
      return res.status(400).json({
        success: false,
        error: "Role ID and View ID are required",
      });
    }

    // Check for existing permission
    const [[exists]] = await pool.query(
      "SELECT id FROM role_permissions WHERE role_id = ? AND view_id = ?",
      [role_id, view_id]
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        error: "Permission already exists for this role-view combination",
      });
    }

    await pool.query(
      `
      INSERT INTO role_permissions
      (
        role_id,
        view_id,
        can_view,
        can_add,
        can_edit,
        can_delete,
        department_scope
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        role_id,
        view_id,
        can_view ? 1 : 0,
        can_add ? 1 : 0,
        can_edit ? 1 : 0,
        can_delete ? 1 : 0,
        department_scope || "ALL",
      ]
    );

    // AUDIT LOG
    const newPermValues = { role_id, view_id, can_view: can_view ? 1 : 0, can_add: can_add ? 1 : 0, can_edit: can_edit ? 1 : 0, can_delete: can_delete ? 1 : 0, department_scope: department_scope || "ALL" };
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "CREATE",
      tableName: "role_permissions",
      recordId: null,
      description: buildChangeDescription("CREATE", "role_permissions", null, null, newPermValues),
      oldValues: null,
      newValues: newPermValues,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
    });
  } catch (error) {
    console.error("POST PERMISSION ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// UPDATE PERMISSION (UPDATE role_permissions)
// ============================================================

app.put("/api/permissions/:id", async (req, res) => {
  try {
    const {
      can_view,
      can_add,
      can_edit,
      can_delete,
      department_scope,
    } = req.body;

    // Fetch old permission for audit
    const [[oldPerm]] = await pool.query("SELECT * FROM role_permissions WHERE id = ?", [req.params.id]);
    const oldValues = oldPerm ? { role_id: oldPerm.role_id, view_id: oldPerm.view_id, can_view: oldPerm.can_view, can_add: oldPerm.can_add, can_edit: oldPerm.can_edit, can_delete: oldPerm.can_delete } : null;

    const [result] = await pool.query(
      `
      UPDATE role_permissions
      SET
        can_view = ?,
        can_add = ?,
        can_edit = ?,
        can_delete = ?,
        department_scope = ?
      WHERE id = ?
      `,
      [
        can_view ? 1 : 0,
        can_add ? 1 : 0,
        can_edit ? 1 : 0,
        can_delete ? 1 : 0,
        department_scope || "ALL",
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Permission not found",
      });
    }

    // AUDIT LOG
    const newValues = { role_id: oldPerm?.role_id, view_id: oldPerm?.view_id, can_view: can_view ? 1 : 0, can_add: can_add ? 1 : 0, can_edit: can_edit ? 1 : 0, can_delete: can_delete ? 1 : 0 };
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "UPDATE",
      tableName: "role_permissions",
      recordId: req.params.id,
      description: buildChangeDescription("UPDATE", "role_permissions", oldPerm, oldValues, newValues),
      oldValues,
      newValues,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Permission updated successfully",
    });
  } catch (error) {
    console.error("PUT PERMISSION ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// DELETE PERMISSION (DELETE FROM role_permissions)
// ============================================================

app.delete("/api/permissions/:id", async (req, res) => {
  try {
    // Fetch old permission for audit
    const [[oldPerm]] = await pool.query("SELECT * FROM role_permissions WHERE id = ?", [req.params.id]);
    const oldValues = oldPerm ? { role_id: oldPerm.role_id, view_id: oldPerm.view_id, can_view: oldPerm.can_view, can_add: oldPerm.can_add, can_edit: oldPerm.can_edit, can_delete: oldPerm.can_delete } : null;

    const [result] = await pool.query(
      "DELETE FROM role_permissions WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: "Permission not found",
      });
    }

    // AUDIT LOG
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: "DELETE",
      tableName: "role_permissions",
      recordId: req.params.id,
      description: buildChangeDescription("DELETE", "role_permissions", oldPerm, oldValues, null),
      oldValues,
      newValues: null,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PERMISSION ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ============================================================
// ROLE-PERMISSIONS MATRIX (NEW API for RolePermissionAllotment)
// ============================================================
// ============================================================

// ============================================================
// GET FULL RBAC MATRIX
// ============================================================

app.get("/api/role-permissions/matrix", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        rp.role_id,
        r.role_name,
        rp.view_id,
        v.view_name,
        v.view_url,
        v.module_name,
        rp.can_view,
        rp.can_add,
        rp.can_edit,
        rp.can_delete,
        rp.department_scope
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN views v ON rp.view_id = v.id
      ORDER BY r.role_name, v.module_name, v.view_name
    `);

    res.json({
      success: true,
      matrix: rows,
    });
  } catch (error) {
    console.error("GET /api/role-permissions/matrix ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// UPDATE SINGLE CELL IN MATRIX
// ============================================================

app.put("/api/role-permissions/:roleId/:viewId", async (req, res) => {
  try {
    const { roleId, viewId } = req.params;
    const { can_view, can_add, can_edit, can_delete, department_scope } = req.body;

    // Upsert: update if exists, insert if not
    const [[exists]] = await pool.query(
      "SELECT * FROM role_permissions WHERE role_id = ? AND view_id = ?",
      [roleId, viewId]
    );

    const permData = {
      role_id: parseInt(roleId),
      view_id: parseInt(viewId),
      can_view: can_view ? 1 : 0,
      can_add: can_add ? 1 : 0,
      can_edit: can_edit ? 1 : 0,
      can_delete: can_delete ? 1 : 0,
      department_scope: department_scope || "ALL",
    };

    let auditAction = "UPDATE";

    if (exists) {
      await pool.query(
        `
        UPDATE role_permissions
        SET can_view = ?, can_add = ?, can_edit = ?, can_delete = ?, department_scope = ?
        WHERE role_id = ? AND view_id = ?
        `,
        [
          can_view ? 1 : 0,
          can_add ? 1 : 0,
          can_edit ? 1 : 0,
          can_delete ? 1 : 0,
          department_scope || "ALL",
          roleId,
          viewId,
        ]
      );
    } else {
      auditAction = "CREATE";
      await pool.query(
        `
        INSERT INTO role_permissions (role_id, view_id, can_view, can_add, can_edit, can_delete, department_scope)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          roleId,
          viewId,
          can_view ? 1 : 0,
          can_add ? 1 : 0,
          can_edit ? 1 : 0,
          can_delete ? 1 : 0,
          department_scope || "ALL",
        ]
      );
    }

    // AUDIT LOG
    const oldValues = exists ? { role_id: exists.role_id, view_id: exists.view_id, can_view: exists.can_view, can_add: exists.can_add, can_edit: exists.can_edit, can_delete: exists.can_delete } : null;
    await logAudit(pool, {
      userId: req.user?.id,
      userEmail: req.user?.email,
      userName: req.user?.name,
      action: auditAction,
      tableName: "role_permissions",
      recordId: exists?.id || null,
      description: buildChangeDescription(auditAction, "role_permissions", exists, oldValues, permData),
      oldValues,
      newValues: permData,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Permission updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/role-permissions/:roleId/:viewId ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ============================================================
// AUDIT LOGS API
// ============================================================
// ============================================================

// ============================================================
// GET ALL AUDIT LOGS (with pagination + filters)
// ============================================================

app.get("/api/audit-logs", async (req, res) => {
  try {
    const { action, table_name, user_email, search, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let where = [];
    let params = [];

    if (action) {
      where.push("action = ?");
      params.push(action);
    }
    if (table_name) {
      where.push("table_name = ?");
      params.push(table_name);
    }
    if (user_email) {
      where.push("user_email LIKE ?");
      params.push(`%${user_email}%`);
    }
    if (search) {
      where.push("description LIKE ?");
      params.push(`%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      logs: rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error("GET /api/audit-logs ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET RECENT AUDIT LOGS (last 10)
// ============================================================

app.get("/api/audit-logs/recent", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10"
    );
    res.json({ success: true, logs: rows });
  } catch (error) {
    console.error("GET /api/audit-logs/recent ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// GET AUDIT LOG STATS
// ============================================================

app.get("/api/audit-logs/stats", async (req, res) => {
  try {
    const [[{ total }]] = await pool.query("SELECT COUNT(*) as total FROM audit_logs");
    const [[{ todayCount }]] = await pool.query(
      "SELECT COUNT(*) as todayCount FROM audit_logs WHERE DATE(created_at) = CURDATE()"
    );

    const [byAction] = await pool.query(
      "SELECT action, COUNT(*) as count FROM audit_logs GROUP BY action"
    );

    const [byTable] = await pool.query(
      "SELECT table_name, COUNT(*) as count FROM audit_logs GROUP BY table_name ORDER BY count DESC"
    );

    res.json({
      success: true,
      stats: {
        total,
        todayCount,
        byAction: Object.fromEntries(byAction.map((r) => [r.action, r.count])),
        byTable: Object.fromEntries(byTable.map((r) => [r.table_name, r.count])),
      },
    });
  } catch (error) {
    console.error("GET /api/audit-logs/stats ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// BRANCHES (for dropdowns)
// ============================================================
// ============================================================

app.get("/api/branches", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        b.id,
        b.branch_name,
        b.branch_code,
        c.course_name
      FROM branches b
      JOIN courses c ON b.course_id = c.id
      ORDER BY c.course_name, b.branch_name
    `);

    res.json({
      success: true,
      branches: rows,
    });
  } catch (error) {
    console.error("GET BRANCHES ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================================
// ============================================================
// COURSES CRUD
// ============================================================
// ============================================================

app.get("/api/courses", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM courses ORDER BY course_name");
    res.json({ success: true, courses: rows });
  } catch (error) {
    console.error("GET COURSES ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/courses/:id", async (req, res) => {
  try {
    const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [req.params.id]);
    if (!course) return res.status(404).json({ success: false, error: "Course not found" });
    res.json({ success: true, course });
  } catch (error) {
    console.error("GET COURSE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/courses", async (req, res) => {
  try {
    const { course_name, course_code, duration_years } = req.body;
    if (!course_name || !course_code) {
      return res.status(400).json({ success: false, error: "course_name and course_code are required" });
    }

    const [[exists]] = await pool.query("SELECT id FROM courses WHERE course_code = ?", [course_code]);
    if (exists) return res.status(400).json({ success: false, error: "Course code already exists" });

    const [result] = await pool.query(
      "INSERT INTO courses (course_name, course_code, duration_years) VALUES (?, ?, ?)",
      [course_name, course_code, duration_years || 4]
    );

    await logAudit(pool, {
      userId: req.user?.id, userEmail: req.user?.email, userName: req.user?.name,
      action: "CREATE", tableName: "courses", recordId: result.insertId,
      description: `Created course "${course_name}" (${course_code})`,
      oldValues: null, newValues: { course_name, course_code, duration_years }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: "Course created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST COURSE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  try {
    const { course_name, course_code, duration_years } = req.body;
    const [[old]] = await pool.query("SELECT * FROM courses WHERE id = ?", [req.params.id]);
    if (!old) return res.status(404).json({ success: false, error: "Course not found" });

    const [[dup]] = await pool.query("SELECT id FROM courses WHERE course_code = ? AND id != ?", [course_code, req.params.id]);
    if (dup) return res.status(400).json({ success: false, error: "Course code already exists" });

    await pool.query(
      "UPDATE courses SET course_name = ?, course_code = ?, duration_years = ? WHERE id = ?",
      [course_name || old.course_name, course_code || old.course_code, duration_years || old.duration_years, req.params.id]
    );

    await logAudit(pool, {
      userId: req.user?.id, userEmail: req.user?.email, userName: req.user?.name,
      action: "UPDATE", tableName: "courses", recordId: req.params.id,
      description: `Updated course "${course_name || old.course_name}"`,
      oldValues: { course_name: old.course_name, course_code: old.course_code }, newValues: { course_name, course_code }, ipAddress: req.ip,
    });

    res.json({ success: true, message: "Course updated successfully" });
  } catch (error) {
    console.error("PUT COURSE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    const [[course]] = await pool.query("SELECT * FROM courses WHERE id = ?", [req.params.id]);
    if (!course) return res.status(404).json({ success: false, error: "Course not found" });

    const [[hasBranches]] = await pool.query("SELECT id FROM branches WHERE course_id = ? LIMIT 1", [req.params.id]);
    if (hasBranches) return res.status(400).json({ success: false, error: "Cannot delete course: linked to branches. Remove branches first." });

    await pool.query("DELETE FROM courses WHERE id = ?", [req.params.id]);

    await logAudit(pool, {
      userId: req.user?.id, userEmail: req.user?.email, userName: req.user?.name,
      action: "DELETE", tableName: "courses", recordId: req.params.id,
      description: `Deleted course "${course.course_name}" (${course.course_code})`,
      oldValues: { course_name: course.course_name, course_code: course.course_code }, newValues: null, ipAddress: req.ip,
    });

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("DELETE COURSE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// BRANCHES CRUD
// ============================================================
// ============================================================

app.get("/api/branches/all", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, c.course_name, c.course_code,
        u.name AS hod_name
      FROM branches b
      JOIN courses c ON b.course_id = c.id
      LEFT JOIN users u ON b.hod_id = u.id
      ORDER BY c.course_name, b.branch_name
    `);
    res.json({ success: true, branches: rows });
  } catch (error) {
    console.error("GET ALL BRANCHES ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/branches/:id", async (req, res) => {
  try {
    const [[branch]] = await pool.query(`
      SELECT b.*, c.course_name, u.name AS hod_name
      FROM branches b
      JOIN courses c ON b.course_id = c.id
      LEFT JOIN users u ON b.hod_id = u.id
      WHERE b.id = ?
    `, [req.params.id]);
    if (!branch) return res.status(404).json({ success: false, error: "Branch not found" });
    res.json({ success: true, branch });
  } catch (error) {
    console.error("GET BRANCH ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/branches", async (req, res) => {
  try {
    const { course_id, branch_name, branch_code, hod_id } = req.body;
    if (!course_id || !branch_name || !branch_code) {
      return res.status(400).json({ success: false, error: "course_id, branch_name, and branch_code are required" });
    }

    const [[course]] = await pool.query("SELECT id FROM courses WHERE id = ?", [course_id]);
    if (!course) return res.status(400).json({ success: false, error: "Invalid course_id" });

    const [[exists]] = await pool.query("SELECT id FROM branches WHERE branch_code = ?", [branch_code]);
    if (exists) return res.status(400).json({ success: false, error: "Branch code already exists" });

    const [result] = await pool.query(
      "INSERT INTO branches (course_id, branch_name, branch_code, hod_id) VALUES (?, ?, ?, ?)",
      [course_id, branch_name, branch_code, hod_id || null]
    );

    await logAudit(pool, {
      userId: req.user?.id, userEmail: req.user?.email, userName: req.user?.name,
      action: "CREATE", tableName: "branches", recordId: result.insertId,
      description: `Created branch "${branch_name}" (${branch_code})`,
      oldValues: null, newValues: { course_id, branch_name, branch_code, hod_id }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: "Branch created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST BRANCH ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/branches/:id", async (req, res) => {
  try {
    const { course_id, branch_name, branch_code, hod_id } = req.body;
    const [[old]] = await pool.query("SELECT * FROM branches WHERE id = ?", [req.params.id]);
    if (!old) return res.status(404).json({ success: false, error: "Branch not found" });

    const [[dup]] = await pool.query("SELECT id FROM branches WHERE branch_code = ? AND id != ?", [branch_code, req.params.id]);
    if (dup) return res.status(400).json({ success: false, error: "Branch code already exists" });

    await pool.query(
      "UPDATE branches SET course_id = ?, branch_name = ?, branch_code = ?, hod_id = ? WHERE id = ?",
      [course_id || old.course_id, branch_name || old.branch_name, branch_code || old.branch_code, hod_id !== undefined ? (hod_id || null) : old.hod_id, req.params.id]
    );

    await logAudit(pool, {
      userId: req.user?.id, userEmail: req.user?.email, userName: req.user?.name,
      action: "UPDATE", tableName: "branches", recordId: req.params.id,
      description: `Updated branch "${branch_name || old.branch_name}"`,
      oldValues: { branch_name: old.branch_name, branch_code: old.branch_code }, newValues: { branch_name, branch_code }, ipAddress: req.ip,
    });

    res.json({ success: true, message: "Branch updated successfully" });
  } catch (error) {
    console.error("PUT BRANCH ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/branches/:id", async (req, res) => {
  try {
    const [[branch]] = await pool.query("SELECT * FROM branches WHERE id = ?", [req.params.id]);
    if (!branch) return res.status(404).json({ success: false, error: "Branch not found" });

    const linkedChecks = [];
    const [[hasStudents]] = await pool.query("SELECT id FROM students WHERE branch_id = ? LIMIT 1", [req.params.id]);
    if (hasStudents) linkedChecks.push("students");

    const [[hasFaculty]] = await pool.query("SELECT id FROM faculty WHERE branch_id = ? LIMIT 1", [req.params.id]);
    if (hasFaculty) linkedChecks.push("faculty");

    const [[hasSemesters]] = await pool.query("SELECT id FROM semesters WHERE branch_id = ? LIMIT 1", [req.params.id]);
    if (hasSemesters) linkedChecks.push("semesters");

    const [[hasUsers]] = await pool.query("SELECT id FROM users WHERE branch_id = ? LIMIT 1", [req.params.id]);
    if (hasUsers) linkedChecks.push("users");

    if (linkedChecks.length > 0) {
      return res.status(400).json({ success: false, error: `Cannot delete branch: linked to ${linkedChecks.join(", ")}. Remove them first.` });
    }

    await pool.query("DELETE FROM branches WHERE id = ?", [req.params.id]);

    await logAudit(pool, {
      userId: req.user?.id, userEmail: req.user?.email, userName: req.user?.name,
      action: "DELETE", tableName: "branches", recordId: req.params.id,
      description: `Deleted branch "${branch.branch_name}" (${branch.branch_code})`,
      oldValues: { branch_name: branch.branch_name, branch_code: branch.branch_code }, newValues: null, ipAddress: req.ip,
    });

    res.json({ success: true, message: "Branch deleted successfully" });
  } catch (error) {
    console.error("DELETE BRANCH ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// SEMESTERS CRUD
// ============================================================
// ============================================================

app.get("/api/semesters", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, b.branch_name, c.course_name
      FROM semesters s
      JOIN branches b ON s.branch_id = b.id
      JOIN courses c ON b.course_id = c.id
      ORDER BY c.course_name, b.branch_name, s.semester_number
    `);
    res.json({ success: true, semesters: rows });
  } catch (error) {
    console.error("GET SEMESTERS ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/semesters", async (req, res) => {
  try {
    const { branch_id, semester_number, regulation, academic_year } = req.body;
    if (!branch_id || !semester_number) {
      return res.status(400).json({ success: false, error: "branch_id and semester_number are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO semesters (branch_id, semester_number, regulation, academic_year) VALUES (?, ?, ?, ?)",
      [branch_id, semester_number, regulation || null, academic_year || null]
    );

    res.status(201).json({ success: true, message: "Semester created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST SEMESTER ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/semesters/:id", async (req, res) => {
  try {
    const [[hasSubjects]] = await pool.query("SELECT id FROM subjects WHERE semester_id = ? LIMIT 1", [req.params.id]);
    if (hasSubjects) return res.status(400).json({ success: false, error: "Cannot delete semester: linked to subjects." });

    await pool.query("DELETE FROM semesters WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Semester deleted successfully" });
  } catch (error) {
    console.error("DELETE SEMESTER ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// SUBJECTS CRUD
// ============================================================
// ============================================================

app.get("/api/subjects", async (req, res) => {
  try {
    const { semester_id } = req.query;
    let query = `
      SELECT sub.*, s.semester_number, b.branch_name, c.course_name
      FROM subjects sub
      JOIN semesters s ON sub.semester_id = s.id
      JOIN branches b ON s.branch_id = b.id
      JOIN courses c ON b.course_id = c.id
    `;
    const params = [];
    if (semester_id) { query += " WHERE sub.semester_id = ?"; params.push(semester_id); }
    query += " ORDER BY c.course_name, b.branch_name, s.semester_number, sub.subject_name";

    const [rows] = await pool.query(query, params);
    res.json({ success: true, subjects: rows });
  } catch (error) {
    console.error("GET SUBJECTS ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/subjects", async (req, res) => {
  try {
    const { semester_id, subject_name, subject_code, credits, subject_type } = req.body;
    if (!semester_id || !subject_name || !subject_code) {
      return res.status(400).json({ success: false, error: "semester_id, subject_name, and subject_code are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO subjects (semester_id, subject_name, subject_code, credits, subject_type) VALUES (?, ?, ?, ?, ?)",
      [semester_id, subject_name, subject_code, credits || 3, subject_type || 'regular']
    );

    res.status(201).json({ success: true, message: "Subject created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST SUBJECT ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const linkedChecks = [];
    const [[hasAttendance]] = await pool.query("SELECT id FROM attendance WHERE subject_id = ? LIMIT 1", [req.params.id]);
    if (hasAttendance) linkedChecks.push("attendance records");

    const [[hasAssignments]] = await pool.query("SELECT id FROM assignments WHERE subject_id = ? LIMIT 1", [req.params.id]);
    if (hasAssignments) linkedChecks.push("assignments");

    const [[hasMarks]] = await pool.query("SELECT id FROM marks WHERE subject_id = ? LIMIT 1", [req.params.id]);
    if (hasMarks) linkedChecks.push("marks records");

    const [[hasFacultyMap]] = await pool.query("SELECT id FROM faculty_subject_mapping WHERE subject_id = ? LIMIT 1", [req.params.id]);
    if (hasFacultyMap) linkedChecks.push("faculty mappings");

    if (linkedChecks.length > 0) {
      return res.status(400).json({ success: false, error: `Cannot delete subject: linked to ${linkedChecks.join(", ")}.` });
    }

    await pool.query("DELETE FROM subjects WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    console.error("DELETE SUBJECT ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// FACULTY CRUD
// ============================================================
// ============================================================

app.get("/api/faculty", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.*, u.name, u.email, u.phone, u.photo_url, u.is_active,
        b.branch_name, c.course_name
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      JOIN branches b ON f.branch_id = b.id
      JOIN courses c ON b.course_id = c.id
      ORDER BY c.course_name, b.branch_name, u.name
    `);
    res.json({ success: true, faculty: rows });
  } catch (error) {
    console.error("GET FACULTY ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/faculty/:id", async (req, res) => {
  try {
    const [[faculty]] = await pool.query(`
      SELECT f.*, u.name, u.email, u.phone, u.photo_url, u.is_active,
        b.branch_name, c.course_name
      FROM faculty f
      JOIN users u ON f.user_id = u.id
      JOIN branches b ON f.branch_id = b.id
      JOIN courses c ON b.course_id = c.id
      WHERE f.id = ?
    `, [req.params.id]);
    if (!faculty) return res.status(404).json({ success: false, error: "Faculty not found" });

    const [subjects] = await pool.query(`
      SELECT sub.*, sub.subject_name AS name
      FROM faculty_subject_mapping fsm
      JOIN subjects sub ON fsm.subject_id = sub.id
      WHERE fsm.faculty_id = ?
    `, [req.params.id]);

    res.json({ success: true, faculty: { ...faculty, subjects } });
  } catch (error) {
    console.error("GET FACULTY ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/faculty", async (req, res) => {
  try {
    const { user_id, faculty_code, branch_id, qualification, experience_years, is_hod } = req.body;
    if (!user_id || !faculty_code || !branch_id) {
      return res.status(400).json({ success: false, error: "user_id, faculty_code, and branch_id are required" });
    }

    const [[userExists]] = await pool.query("SELECT id FROM users WHERE id = ?", [user_id]);
    if (!userExists) return res.status(400).json({ success: false, error: "Invalid user_id" });

    const [[codeExists]] = await pool.query("SELECT id FROM faculty WHERE faculty_code = ?", [faculty_code]);
    if (codeExists) return res.status(400).json({ success: false, error: "Faculty code already exists" });

    const [result] = await pool.query(
      "INSERT INTO faculty (user_id, faculty_code, branch_id, qualification, experience_years, is_hod) VALUES (?, ?, ?, ?, ?, ?)",
      [user_id, faculty_code, branch_id, qualification || null, experience_years || 0, is_hod ? 1 : 0]
    );

    res.status(201).json({ success: true, message: "Faculty created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST FACULTY ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/faculty/:id", async (req, res) => {
  try {
    const { faculty_code, branch_id, qualification, experience_years, is_hod } = req.body;
    const [[old]] = await pool.query("SELECT * FROM faculty WHERE id = ?", [req.params.id]);
    if (!old) return res.status(404).json({ success: false, error: "Faculty not found" });

    await pool.query(
      "UPDATE faculty SET faculty_code = ?, branch_id = ?, qualification = ?, experience_years = ?, is_hod = ? WHERE id = ?",
      [faculty_code || old.faculty_code, branch_id || old.branch_id, qualification || old.qualification, experience_years !== undefined ? experience_years : old.experience_years, is_hod !== undefined ? (is_hod ? 1 : 0) : old.is_hod, req.params.id]
    );

    res.json({ success: true, message: "Faculty updated successfully" });
  } catch (error) {
    console.error("PUT FACULTY ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/faculty/:id", async (req, res) => {
  try {
    const [[faculty]] = await pool.query("SELECT * FROM faculty WHERE id = ?", [req.params.id]);
    if (!faculty) return res.status(404).json({ success: false, error: "Faculty not found" });

    const linkedChecks = [];
    const [[hasClasses]] = await pool.query("SELECT id FROM timetable WHERE faculty_id = ? LIMIT 1", [req.params.id]);
    if (hasClasses) linkedChecks.push("timetable entries");

    const [[hasAttendance]] = await pool.query("SELECT id FROM attendance WHERE faculty_id = ? LIMIT 1", [req.params.id]);
    if (hasAttendance) linkedChecks.push("attendance records");

    const [[hasAssignments]] = await pool.query("SELECT id FROM assignments WHERE faculty_id = ? LIMIT 1", [req.params.id]);
    if (hasAssignments) linkedChecks.push("assignments");

    const [[hasFacultyMap]] = await pool.query("SELECT id FROM faculty_subject_mapping WHERE faculty_id = ? LIMIT 1", [req.params.id]);
    if (hasFacultyMap) linkedChecks.push("subject mappings");

    if (linkedChecks.length > 0) {
      return res.status(400).json({ success: false, error: `Cannot delete faculty: linked to ${linkedChecks.join(", ")}. Remove them first.` });
    }

    await pool.query("DELETE FROM faculty WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Faculty deleted successfully" });
  } catch (error) {
    console.error("DELETE FACULTY ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// FACULTY SUBJECT MAPPING
// ============================================================
// ============================================================

app.get("/api/faculty-subject-mapping", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT fsm.*, f.faculty_code, u.name AS faculty_name,
        sub.subject_name, sub.subject_code
      FROM faculty_subject_mapping fsm
      JOIN faculty f ON fsm.faculty_id = f.id
      JOIN users u ON f.user_id = u.id
      JOIN subjects sub ON fsm.subject_id = sub.id
      ORDER BY u.name, sub.subject_name
    `);
    res.json({ success: true, mappings: rows });
  } catch (error) {
    console.error("GET FACULTY-SUBJECT MAPPING ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/faculty-subject-mapping", async (req, res) => {
  try {
    const { faculty_id, subject_id, academic_year } = req.body;
    if (!faculty_id || !subject_id) {
      return res.status(400).json({ success: false, error: "faculty_id and subject_id are required" });
    }

    const [[exists]] = await pool.query(
      "SELECT id FROM faculty_subject_mapping WHERE faculty_id = ? AND subject_id = ?",
      [faculty_id, subject_id]
    );
    if (exists) return res.status(400).json({ success: false, error: "Mapping already exists" });

    const [result] = await pool.query(
      "INSERT INTO faculty_subject_mapping (faculty_id, subject_id, academic_year) VALUES (?, ?, ?)",
      [faculty_id, subject_id, academic_year || null]
    );

    res.status(201).json({ success: true, message: "Mapping created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST FACULTY-SUBJECT MAPPING ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/faculty-subject-mapping/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM faculty_subject_mapping WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Mapping deleted successfully" });
  } catch (error) {
    console.error("DELETE FACULTY-SUBJECT MAPPING ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// STUDENTS CRUD
// ============================================================
// ============================================================

app.get("/api/students", async (req, res) => {
  try {
    const { branch_id, semester_id } = req.query;
    let query = `
      SELECT st.*, u.name, u.email, u.phone, u.photo_url, u.is_active,
        b.branch_name, c.course_name, s.semester_number,
        mentor.name AS mentor_name
      FROM students st
      JOIN users u ON st.user_id = u.id
      JOIN branches b ON st.branch_id = b.id
      JOIN courses c ON b.course_id = c.id
      JOIN semesters s ON st.semester_id = s.id
      LEFT JOIN users mentor ON st.mentor_id = mentor.id
    `;
    const conditions = [];
    const params = [];
    if (branch_id) { conditions.push("st.branch_id = ?"); params.push(branch_id); }
    if (semester_id) { conditions.push("st.semester_id = ?"); params.push(semester_id); }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY c.course_name, b.branch_name, s.semester_number, st.roll_no";

    const [rows] = await pool.query(query, params);
    res.json({ success: true, students: rows });
  } catch (error) {
    console.error("GET STUDENTS ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/students/:id", async (req, res) => {
  try {
    const [[student]] = await pool.query(`
      SELECT st.*, u.name, u.email, u.phone, u.photo_url, u.is_active,
        b.branch_name, c.course_name, s.semester_number,
        mentor.name AS mentor_name
      FROM students st
      JOIN users u ON st.user_id = u.id
      JOIN branches b ON st.branch_id = b.id
      JOIN courses c ON b.course_id = c.id
      JOIN semesters s ON st.semester_id = s.id
      LEFT JOIN users mentor ON st.mentor_id = mentor.id
      WHERE st.id = ?
    `, [req.params.id]);
    if (!student) return res.status(404).json({ success: false, error: "Student not found" });
    res.json({ success: true, student });
  } catch (error) {
    console.error("GET STUDENT ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const { user_id, admission_no, roll_no, branch_id, semester_id, section, mentor_id, cgpa, backlog_count, scholarship_category, admission_year, is_hosteler, rfid_card_no } = req.body;
    if (!user_id || !admission_no || !roll_no || !branch_id || !semester_id) {
      return res.status(400).json({ success: false, error: "user_id, admission_no, roll_no, branch_id, and semester_id are required" });
    }

    const [[userExists]] = await pool.query("SELECT id FROM users WHERE id = ?", [user_id]);
    if (!userExists) return res.status(400).json({ success: false, error: "Invalid user_id" });

    const [[admExists]] = await pool.query("SELECT id FROM students WHERE admission_no = ?", [admission_no]);
    if (admExists) return res.status(400).json({ success: false, error: "Admission number already exists" });

    const [[rollExists]] = await pool.query("SELECT id FROM students WHERE roll_no = ?", [roll_no]);
    if (rollExists) return res.status(400).json({ success: false, error: "Roll number already exists" });

    const [result] = await pool.query(
      `INSERT INTO students (user_id, admission_no, roll_no, branch_id, semester_id, section, mentor_id, cgpa, backlog_count, scholarship_category, admission_year, is_hosteler, rfid_card_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, admission_no, roll_no, branch_id, semester_id, section || 'A', mentor_id || null, cgpa || 0, backlog_count || 0, scholarship_category || null, admission_year || null, is_hosteler ? 1 : 0, rfid_card_no || null]
    );

    res.status(201).json({ success: true, message: "Student created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST STUDENT ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const { admission_no, roll_no, branch_id, semester_id, section, mentor_id, cgpa, backlog_count, scholarship_category, admission_year, is_hosteler, rfid_card_no } = req.body;
    const [[old]] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (!old) return res.status(404).json({ success: false, error: "Student not found" });

    await pool.query(
      `UPDATE students SET admission_no = ?, roll_no = ?, branch_id = ?, semester_id = ?, section = ?, mentor_id = ?,
       cgpa = ?, backlog_count = ?, scholarship_category = ?, admission_year = ?, is_hosteler = ?, rfid_card_no = ? WHERE id = ?`,
      [admission_no || old.admission_no, roll_no || old.roll_no, branch_id || old.branch_id, semester_id || old.semester_id,
       section || old.section, mentor_id !== undefined ? (mentor_id || null) : old.mentor_id,
       cgpa !== undefined ? cgpa : old.cgpa, backlog_count !== undefined ? backlog_count : old.backlog_count,
       scholarship_category !== undefined ? scholarship_category : old.scholarship_category,
       admission_year !== undefined ? admission_year : old.admission_year,
       is_hosteler !== undefined ? (is_hosteler ? 1 : 0) : old.is_hosteler,
       rfid_card_no !== undefined ? rfid_card_no : old.rfid_card_no, req.params.id]
    );

    res.json({ success: true, message: "Student updated successfully" });
  } catch (error) {
    console.error("PUT STUDENT ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const [[student]] = await pool.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
    if (!student) return res.status(404).json({ success: false, error: "Student not found" });

    const linkedChecks = [];
    const [[hasAttendance]] = await pool.query("SELECT id FROM attendance WHERE student_id = ? LIMIT 1", [req.params.id]);
    if (hasAttendance) linkedChecks.push("attendance records");

    const [[hasMarks]] = await pool.query("SELECT id FROM marks WHERE student_id = ? LIMIT 1", [req.params.id]);
    if (hasMarks) linkedChecks.push("marks records");

    const [[hasSubmissions]] = await pool.query("SELECT id FROM assignment_submissions WHERE student_id = ? LIMIT 1", [req.params.id]);
    if (hasSubmissions) linkedChecks.push("assignment submissions");

    const [[hasFees]] = await pool.query("SELECT id FROM fees_collection WHERE student_id = ? LIMIT 1", [req.params.id]);
    if (hasFees) linkedChecks.push("fee records");

    const [[hasPlacement]] = await pool.query("SELECT id FROM placement_applications WHERE student_id = ? LIMIT 1", [req.params.id]);
    if (hasPlacement) linkedChecks.push("placement applications");

    if (linkedChecks.length > 0) {
      return res.status(400).json({ success: false, error: `Cannot delete student: linked to ${linkedChecks.join(", ")}. Remove them first.` });
    }

    await pool.query("DELETE FROM students WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("DELETE STUDENT ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// FEES STRUCTURE CRUD
// ============================================================
// ============================================================

app.get("/api/fees-structure", async (req, res) => {
  try {
    const { branch_id, semester_id } = req.query;
    let query = `
      SELECT fs.*, b.branch_name, s.semester_number, c.course_name
      FROM fees_structure fs
      JOIN branches b ON fs.branch_id = b.id
      JOIN courses c ON b.course_id = c.id
      JOIN semesters s ON fs.semester_id = s.id
    `;
    const conditions = [];
    const params = [];
    if (branch_id) { conditions.push("fs.branch_id = ?"); params.push(branch_id); }
    if (semester_id) { conditions.push("fs.semester_id = ?"); params.push(semester_id); }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY c.course_name, b.branch_name, s.semester_number, fs.fee_type";

    const [rows] = await pool.query(query, params);
    res.json({ success: true, fees_structure: rows });
  } catch (error) {
    console.error("GET FEES STRUCTURE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/fees-structure", async (req, res) => {
  try {
    const { branch_id, semester_id, fee_type, amount, academic_year } = req.body;
    if (!branch_id || !semester_id || !fee_type || !amount) {
      return res.status(400).json({ success: false, error: "branch_id, semester_id, fee_type, and amount are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO fees_structure (branch_id, semester_id, fee_type, amount, academic_year) VALUES (?, ?, ?, ?, ?)",
      [branch_id, semester_id, fee_type, amount, academic_year || null]
    );

    res.status(201).json({ success: true, message: "Fee structure created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST FEES STRUCTURE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/fees-structure/:id", async (req, res) => {
  try {
    const { fee_type, amount, academic_year } = req.body;
    const [[old]] = await pool.query("SELECT * FROM fees_structure WHERE id = ?", [req.params.id]);
    if (!old) return res.status(404).json({ success: false, error: "Fee structure not found" });

    await pool.query(
      "UPDATE fees_structure SET fee_type = ?, amount = ?, academic_year = ? WHERE id = ?",
      [fee_type || old.fee_type, amount || old.amount, academic_year !== undefined ? academic_year : old.academic_year, req.params.id]
    );

    res.json({ success: true, message: "Fee structure updated successfully" });
  } catch (error) {
    console.error("PUT FEES STRUCTURE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/fees-structure/:id", async (req, res) => {
  try {
    const [[hasCollection]] = await pool.query("SELECT id FROM fees_collection WHERE fee_structure_id = ? LIMIT 1", [req.params.id]);
    if (hasCollection) return res.status(400).json({ success: false, error: "Cannot delete fee structure: linked to fee collections." });

    await pool.query("DELETE FROM fees_structure WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Fee structure deleted successfully" });
  } catch (error) {
    console.error("DELETE FEES STRUCTURE ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// FEES COLLECTION CRUD
// ============================================================
// ============================================================

app.get("/api/fees-collection", async (req, res) => {
  try {
    const { student_id, branch_id } = req.query;
    let query = `
      SELECT fc.*, st.admission_no, st.roll_no, u.name AS student_name,
        fs.fee_type, fs.amount AS fee_amount, b.branch_name
      FROM fees_collection fc
      JOIN students st ON fc.student_id = st.id
      JOIN users u ON st.user_id = u.id
      JOIN fees_structure fs ON fc.fee_structure_id = fs.id
      JOIN branches b ON st.branch_id = b.id
    `;
    const conditions = [];
    const params = [];
    if (student_id) { conditions.push("fc.student_id = ?"); params.push(student_id); }
    if (branch_id) { conditions.push("st.branch_id = ?"); params.push(branch_id); }
    if (conditions.length) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY fc.payment_date DESC";

    const [rows] = await pool.query(query, params);
    res.json({ success: true, fees_collection: rows });
  } catch (error) {
    console.error("GET FEES COLLECTION ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/fees-collection", async (req, res) => {
  try {
    const { student_id, fee_structure_id, amount_paid, scholarship_amount, fine_amount, total_payable, payment_mode, receipt_no, collected_by } = req.body;
    if (!student_id || !fee_structure_id || !amount_paid) {
      return res.status(400).json({ success: false, error: "student_id, fee_structure_id, and amount_paid are required" });
    }

    const [result] = await pool.query(
      `INSERT INTO fees_collection (student_id, fee_structure_id, amount_paid, scholarship_amount, fine_amount, total_payable, payment_mode, receipt_no, payment_date, collected_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [student_id, fee_structure_id, amount_paid, scholarship_amount || 0, fine_amount || 0, total_payable || amount_paid, payment_mode || 'cash', receipt_no || null, collected_by || null]
    );

    res.status(201).json({ success: true, message: "Fee payment recorded successfully", id: result.insertId });
  } catch (error) {
    console.error("POST FEES COLLECTION ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/fees-collection/:id", async (req, res) => {
  try {
    const [[record]] = await pool.query("SELECT * FROM fees_collection WHERE id = ?", [req.params.id]);
    if (!record) return res.status(404).json({ success: false, error: "Fee record not found" });

    await pool.query("DELETE FROM fees_collection WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Fee record deleted successfully" });
  } catch (error) {
    console.error("DELETE FEES COLLECTION ERROR:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
