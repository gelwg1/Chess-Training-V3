import pool from "../config/db.js";

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM puzzles");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export default { getAllUsers };
