import pool from "../config/db.js";

const getAllPuzzles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.fen, p.computer_move, set.name, s.solution FROM puzzles p JOIN solutions s ON s.puzzle_id=p.id JOIN sets set ON p.set_id=set.id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};
const uploadPuzzle = async (req, res) => {
  const { fen, solution, setName } = req.body; // Assuming you send this data in the request body
  if (!fen || !solution || !setName) {
    return res.status(400).json({ error: "Missing required fields (fen, solution, or setName)" });
  }
  try {
    await pool.query('BEGIN');
    let setResult = await pool.query(
      'SELECT id FROM sets WHERE name = $1',
      [setName]
    );

    let setId;
    if (setResult.rows.length === 0) {
      const newSet = await pool.query(
        'INSERT INTO sets (name) VALUES ($1) RETURNING id',
        [setName]
      );
      setId = newSet.rows[0].id;
    } else {
      setId = setResult.rows[0].id;
    }
    // 2. Insert the puzzle
    const puzzleResult = await pool.query(
      'INSERT INTO puzzles (fen, set_id) VALUES ($1, $2) RETURNING id',
      [fen, setId]
    );
    const puzzleId = puzzleResult.rows[0].id;
    // 3. Insert the solution
    await pool.query(
      'INSERT INTO solutions (solution, puzzle_id) VALUES ($1, $2)',
      [solution, puzzleId]
    );
    await pool.query('COMMIT');
    res.status(201).json({
      message: 'Puzzle uploaded successfully',
      puzzleId,
      setId
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error uploading puzzle:', err.message);
    res.status(500).json({ error: "Failed to upload puzzle" });
  }
};

const editPuzzle = async (req, res) => {
  const { id } = req.params; // Puzzle ID to edit
  const { fen, solution, setName } = req.body; // Fields that can be updated

  if (!id) {
    return res.status(400).json({ error: "Puzzle ID is required" });
  }

  try {
    await pool.query('BEGIN');

    // 1. Verify the puzzle exists
    const puzzleCheck = await pool.query(
      'SELECT id FROM puzzles WHERE id = $1',
      [id]
    );

    if (puzzleCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Puzzle not found" });
    }

    // 2. Handle set update if provided
    let updateSetQuery = '';
    let setParams = [];

    if (setName) {
      // Check if set exists or create it
      let setResult = await pool.query(
        'SELECT id FROM sets WHERE name = $1',
        [setName]
      );

      let setId;
      if (setResult.rows.length === 0) {
        const newSet = await pool.query(
          'INSERT INTO sets (name) VALUES ($1) RETURNING id',
          [setName]
        );
        setId = newSet.rows[0].id;
      } else {
        setId = setResult.rows[0].id;
      }

      updateSetQuery = 'set_id = $1, ';
      setParams = [setId];
    }

    // 3. Update puzzle if FEN is provided
    if (fen) {
      const updatePuzzleQuery = `
        UPDATE puzzles 
        SET ${updateSetQuery} fen = $${setParams.length + 1} 
        WHERE id = $${setParams.length + 2}
        RETURNING *`;

      const updateParams = [...setParams, fen, id];
      await pool.query(updatePuzzleQuery, updateParams);
    } else if (setName) {
      // Only updating set, not FEN
      const updatePuzzleQuery = `
        UPDATE puzzles 
        SET set_id = $1 
        WHERE id = $2`;

      await pool.query(updatePuzzleQuery, [setParams[0], id]);
    }

    // 4. Update solution if provided
    if (solution) {
      await pool.query(
        `INSERT INTO solutions (solution, puzzle_id) 
         VALUES ($1, $2)
         ON CONFLICT (puzzle_id) 
         DO UPDATE SET solution = EXCLUDED.solution`,
        [solution, id]
      );
    }

    await pool.query('COMMIT');

    // Get the updated puzzle to return
    const updatedPuzzle = await pool.query(`
      SELECT p.id, p.fen, s.name as set_name, sol.solution 
      FROM puzzles p
      LEFT JOIN sets s ON p.set_id = s.id
      LEFT JOIN solutions sol ON sol.puzzle_id = p.id
      WHERE p.id = $1
    `, [id]);

    res.status(200).json({
      message: 'Puzzle updated successfully',
      puzzle: updatedPuzzle.rows[0]
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error updating puzzle:', err.message);
    res.status(500).json({ error: "Failed to update puzzle" });
  }
};

export default { getAllPuzzles, uploadPuzzle, editPuzzle };
