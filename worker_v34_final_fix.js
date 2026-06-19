export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const headers = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }


    function normalizeRoomCode(value) {
      return String(value || "").trim().toUpperCase();
    }

    function generateFriendlyRoomCode() {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const number = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
      return letter + number;
    }

    async function generateUniqueRoomCode() {
      for (let i = 0; i < 20; i++) {
        const code = generateFriendlyRoomCode();
        const existing = await env.DB.prepare(
          "SELECT id FROM Championships WHERE room_code = ? LIMIT 1"
        ).bind(code).first();
        if (!existing) return code;
      }
      return generateFriendlyRoomCode();
    }

    if (url.pathname === "/" || url.pathname === "/api/health") {
      return new Response(JSON.stringify({
        ok: true,
        service: "SmartChessMath API",
        database: "connected"
      }), { headers });
    }

    if (url.pathname === "/api/tables") {
      const result = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).all();

      return new Response(JSON.stringify({
        ok: true,
        tables: result.results
      }), { headers });
    }
if (url.pathname === "/api/students") {
  const result = await env.DB.prepare(
    "SELECT * FROM Students"
  ).all();

  return new Response(JSON.stringify({
    ok: true,
    students: result.results
  }), { headers });
}
if (url.pathname === "/api/schools") {
  const result = await env.DB.prepare(
    "SELECT * FROM Schools"
  ).all();

  return new Response(JSON.stringify({
    ok: true,
    schools: result.results
  }), { headers });
}

if (url.pathname === "/api/championships") {
  const result = await env.DB.prepare(
    "SELECT * FROM Championships"
  ).all();

  return new Response(JSON.stringify({
    ok: true,
    championships: result.results
  }), { headers });
}
if (url.pathname === "/api/results") {
  const result = await env.DB.prepare(
    "SELECT * FROM Results"
  ).all();

return new Response(JSON.stringify({
    ok: true,
    results: result.results
}), { headers });
}

if (url.pathname === "/api/certificates") {
  const result = await env.DB.prepare(
    "SELECT * FROM Certificates"
  ).all();

  return new Response(JSON.stringify({
    ok: true,
    certificates: result.results
  }), { headers });
  }
if (url.pathname === "/api/create-championship" && request.method === "POST") {
    let data = {};
  try {
    const bodyText = await request.text();
    data = bodyText ? JSON.parse(bodyText) : {};
  } catch (e) {
    data = {};
  }

  const championshipName = data.championship_name || "Smart Chess Math Championship";
  const requestedRoomCode = normalizeRoomCode(data.room_code);
  const roomCode = requestedRoomCode || await generateUniqueRoomCode();
  const programName = data.program_name || "Knight Number Quest";
  const rounds = data.rounds || 3;
  const rankingRule = data.ranking_rule || "STARS_SOLVED_TIME";
  const status = data.status || "Active";

  const organizerName = data.organizer_name || data.organizer || "";

  let result;
  try {
    result = await env.DB.prepare(
      `INSERT INTO Championships 
      (championship_name, room_code, program_name, rounds, ranking_rule, status, start_date, organizer_name)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`
    ).bind(
      championshipName,
      roomCode,
      programName,
      rounds,
      rankingRule,
      status,
      organizerName
    ).run();
  } catch (e) {
    result = await env.DB.prepare(
      `INSERT INTO Championships 
      (championship_name, room_code, program_name, rounds, ranking_rule, status, start_date)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      championshipName,
      roomCode,
      programName,
      rounds,
      rankingRule,
      status
    ).run();
  }

  return new Response(JSON.stringify({
    ok: true,
    message: "Championship created",
    room_code: roomCode,
    championship_id: result.meta.last_row_id
  }), { headers });
  }
  if (url.pathname === "/api/join-room" && request.method === "POST") {

  const data = await request.json();

  const studentName = data.student_name;
  const age = data.age;
  const grade = data.grade;
  const schoolName = data.school_name || data.school || "";
  const roomCode = normalizeRoomCode(data.room_code);

  const championship = await env.DB.prepare(
    "SELECT * FROM Championships WHERE room_code = ?"
  ).bind(roomCode).first();

  if (!championship) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Room not found"
    }), { headers });
  }

  let result;
  try {
    result = await env.DB.prepare(`
      INSERT INTO Students
      (student_name, age, grade, school_name, room_code, championship_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      studentName,
      age,
      grade,
      schoolName,
      roomCode,
      championship.id
    )
    .run();
  } catch (e) {
    result = await env.DB.prepare(`
      INSERT INTO Students
      (student_name, age, grade, room_code, championship_id)
      VALUES (?, ?, ?, ?, ?)
    `)
    .bind(
      studentName,
      age,
      grade,
      roomCode,
      championship.id
    )
    .run();
  }

  return new Response(JSON.stringify({
    ok: true,
    student_id: result.meta.last_row_id,
    championship_id: championship.id,
    championship_name: championship.championship_name,
    school_name: schoolName
  }), { headers });
}
if (url.pathname === "/api/room-students") {
  const roomCode = normalizeRoomCode(url.searchParams.get("room_code"));

  if (!roomCode) {
    return new Response(JSON.stringify({
      ok: false,
      error: "room_code is required"
    }), { headers });
  }

  let result;
  try {
    result = await env.DB.prepare(
      "SELECT id, student_name, age, grade, school_name, room_code, championship_id, created_at FROM Students WHERE room_code = ? ORDER BY id ASC"
    ).bind(roomCode).all();
  } catch (e) {
    result = await env.DB.prepare(
      "SELECT id, student_name, age, grade, room_code, championship_id, created_at FROM Students WHERE room_code = ? ORDER BY id ASC"
    ).bind(roomCode).all();
  }

  return new Response(JSON.stringify({
    ok: true,
    room_code: roomCode,
    students: result.results
  }), { headers });
  }
  if (url.pathname === "/api/championship-info") {

  const roomCode = normalizeRoomCode(url.searchParams.get("room_code"));

  if (!roomCode) {
    return new Response(JSON.stringify({
      ok: false,
      error: "room_code is required"
    }), { headers });
  }

  const championship = await env.DB.prepare(
    "SELECT * FROM Championships WHERE room_code = ?"
  ).bind(roomCode).first();

  if (!championship) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Championship not found"
    }), { headers });
  }

  const players = await env.DB.prepare(
    "SELECT COUNT(*) as total FROM Students WHERE room_code = ?"
  ).bind(roomCode).first();

  return new Response(JSON.stringify({
    ok: true,
    championship_name: championship.championship_name,
    room_code: championship.room_code,
    program_name: championship.program_name,
    rounds: championship.rounds,
    status: championship.status,
    players_count: players.total
  }), { headers });
}
if (url.pathname === "/api/save-result" && request.method === "POST") {
  const data = await request.json();
  const roundNumber = Number(data.round_number || 1);

  // One official row per student / championship / round.
  // This prevents duplicate results and lets the final submission replace progress data.
  await env.DB.prepare(`
    DELETE FROM Results
    WHERE student_id = ? AND championship_id = ? AND round_number = ?
  `).bind(data.student_id, data.championship_id, roundNumber).run();

  const result = await env.DB.prepare(`
    INSERT INTO Results
    (student_id, championship_id, score, points, stars, solved_questions, total_time, max_streak, round_number, mode, level, metrics_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.student_id,
    data.championship_id,
    data.score || 0,
    data.points || 0,
    data.stars ?? 0,
    data.solved_questions || 0,
    data.total_time || 0,
    data.max_streak || 0,
    roundNumber,
    data.mode || "Knight Number Quest",
    data.level || "Round",
    JSON.stringify(Object.assign({}, data.metrics || {}, {
      status: (data.metrics && data.metrics.status) || data.status || "Finished",
      official: true,
      saved_at: new Date().toISOString()
    }))
  ).run();

  return new Response(JSON.stringify({
    ok: true,
    message: "Result saved",
    result_id: result.meta.last_row_id
  }), { headers });
  }

if (url.pathname === "/api/save-progress" && request.method === "POST") {
  const data = await request.json();
  const roundNumber = Number(data.round_number || 1);

  if (!data.student_id || !data.championship_id) {
    return new Response(JSON.stringify({
      ok: false,
      error: "student_id and championship_id are required"
    }), { headers });
  }

  // Latest live progress row only. If internet drops, the teacher still sees the latest submitted progress.
  await env.DB.prepare(`
    DELETE FROM Results
    WHERE student_id = ? AND championship_id = ? AND round_number = ?
  `).bind(data.student_id, data.championship_id, roundNumber).run();

  const metrics = Object.assign({}, data.metrics || {}, {
    status: data.status || (data.metrics && data.metrics.status) || "playing",
    progress: true,
    saved_at: new Date().toISOString()
  });

  const result = await env.DB.prepare(`
    INSERT INTO Results
    (student_id, championship_id, score, points, stars, solved_questions, total_time, max_streak, round_number, mode, level, metrics_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.student_id,
    data.championship_id,
    data.score || data.stars || 0,
    data.points || data.stars || 0,
    data.stars ?? 0,
    data.solved_questions || 0,
    data.total_time || 0,
    data.max_streak || 0,
    roundNumber,
    data.mode || "Knight Number Quest",
    data.level || "Round",
    JSON.stringify(metrics)
  ).run();

  return new Response(JSON.stringify({
    ok: true,
    message: "Progress saved",
    result_id: result.meta.last_row_id
  }), { headers });
}

if (url.pathname === "/api/leaderboard") {
  const roomCode = normalizeRoomCode(url.searchParams.get("room_code"));
  const roundNumber = url.searchParams.get("round_number");

  if (!roomCode) {
    return new Response(JSON.stringify({
      ok: false,
      error: "room_code is required"
    }), { headers });
  }

  let sql = `
    SELECT 
      Students.id as student_id,
      Students.student_name,
      Students.age,
      Students.grade,
      Students.school_name,
      Results.id as result_id,
      Results.round_number,
      Results.stars,
      Results.solved_questions,
      Results.total_time,
      Results.points,
      Results.max_streak,
      COALESCE(Results.official_saved, 0) as official_saved,
      Results.metrics_json
    FROM Results
    JOIN Students ON Results.student_id = Students.id
    WHERE Students.room_code = ?
  `;

  const params = [roomCode];

  if (roundNumber) {
    sql += " AND Results.round_number = ?";
    params.push(Number(roundNumber));
  }

  sql += `
    ORDER BY 
      Results.stars DESC,
      Results.solved_questions DESC,
      Results.total_time ASC
  `;

  let result;
  try {
    result = await env.DB.prepare(sql).bind(...params).all();
  } catch (e) {
    sql = `
      SELECT 
        Students.id as student_id,
        Students.student_name,
        Students.age,
        Students.grade,
        Results.id as result_id,
        Results.round_number,
        Results.stars,
        Results.solved_questions,
        Results.total_time,
        Results.points,
        Results.max_streak,
        COALESCE(Results.official_saved, 0) as official_saved,
        Results.metrics_json
      FROM Results
      JOIN Students ON Results.student_id = Students.id
      WHERE Students.room_code = ?
    `;
    if (roundNumber) sql += " AND Results.round_number = ?";
    sql += `
      ORDER BY 
        Results.stars DESC,
        Results.solved_questions DESC,
        Results.total_time ASC,
        Results.id DESC
    `;
    result = await env.DB.prepare(sql).bind(...params).all();
  }

  // Deduplicate repeated result submissions for the same student and round.
  // Prefer officially saved rows, then better score, then faster time, then latest result_id.
  const bestByStudent = new Map();
  for (const row of result.results) {
    const key = `${row.student_id}-${row.round_number}`;
    const old = bestByStudent.get(key);
    if (!old) { bestByStudent.set(key, row); continue; }
    const better =
      (Number(row.official_saved || 0) - Number(old.official_saved || 0)) ||
      (Number(row.stars || 0) - Number(old.stars || 0)) ||
      (Number(row.solved_questions || 0) - Number(old.solved_questions || 0)) ||
      (Number(old.total_time || 999999) - Number(row.total_time || 999999)) ||
      (Number(row.result_id || 0) - Number(old.result_id || 0));
    if (better > 0) bestByStudent.set(key, row);
  }

  const rows = Array.from(bestByStudent.values()).sort((a, b) =>
    Number(b.stars || 0) - Number(a.stars || 0) ||
    Number(b.solved_questions || 0) - Number(a.solved_questions || 0) ||
    Number(a.total_time || 999999) - Number(b.total_time || 999999)
  );

  let currentRank = 0;
  let previous = null;
  const ranked = rows.map((row, index) => {
    const same = previous &&
      Number(row.stars || 0) === Number(previous.stars || 0) &&
      Number(row.solved_questions || 0) === Number(previous.solved_questions || 0) &&
      Number(row.total_time || 0) === Number(previous.total_time || 0);
    if (!same) currentRank = index + 1;
    previous = row;
    return { rank: currentRank, ...row };
  });

  return new Response(JSON.stringify({
    ok: true,
    room_code: roomCode,
    round_number: roundNumber ? Number(roundNumber) : "all",
    leaderboard: ranked
  }), { headers });
}
if (url.pathname === "/api/final-results") {

  const roomCode = normalizeRoomCode(url.searchParams.get("room_code"));

  const result = await env.DB.prepare(`
    SELECT
      s.id as student_id,
      s.student_name,

      SUM(r.stars) as total_stars,
      SUM(r.solved_questions) as total_solved,
      SUM(r.total_time) as total_time

    FROM Results r
    JOIN Students s ON s.id = r.student_id

    WHERE s.room_code = ?

    GROUP BY s.id

    ORDER BY
      total_stars DESC,
      total_solved DESC,
      total_time ASC
  `)
  .bind(roomCode)
  .all();

  const ranked = result.results.map((row, index) => {
  let medal = null;

  if (index === 0) medal = "Gold";
  else if (index === 1) medal = "Silver";
  else if (index === 2) medal = "Bronze";

  return {
    rank: index + 1,
    medal,
    ...row
  };
});

  return new Response(JSON.stringify({
    ok: true,
    room_code: roomCode,
    final_results: ranked
  }), { headers });


}

if (url.pathname === "/api/start-challenge" && request.method === "POST") {
  let data = {};
  try {
    const bodyText = await request.text();
    data = bodyText ? JSON.parse(bodyText) : {};
  } catch (e) {
    data = {};
  }

  const roomCode = normalizeRoomCode(data.room_code);
  const roundNumber = Number(data.round_number || 1);

  if (!roomCode) {
    return new Response(JSON.stringify({
      ok: false,
      error: "room_code is required"
    }), { headers });
  }

  const championship = await env.DB.prepare(
    "SELECT * FROM Championships WHERE room_code = ?"
  ).bind(roomCode).first();

  if (!championship) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Championship not found"
    }), { headers });
  }

  await env.DB.prepare(`
    UPDATE Championships
    SET challenge_started = 1,
        current_round = ?,
        challenge_finished = 0,
        status = 'Started'
    WHERE room_code = ?
  `).bind(roundNumber, roomCode).run();

  return new Response(JSON.stringify({
    ok: true,
    message: "Challenge started",
    room_code: roomCode,
    round_number: roundNumber,
    challenge_started: 1,
    challenge_finished: 0
  }), { headers });
}

if (url.pathname === "/api/room-status") {
  const roomCode = normalizeRoomCode(url.searchParams.get("room_code"));

  if (!roomCode) {
    return new Response(JSON.stringify({
      ok: false,
      error: "room_code is required"
    }), { headers });
  }

  const championship = await env.DB.prepare(`
    SELECT
      id,
      championship_name,
      room_code,
      program_name,
      rounds,
      status,
      challenge_started,
      current_round,
      challenge_finished
    FROM Championships
    WHERE room_code = ?
  `).bind(roomCode).first();

  if (!championship) {
    return new Response(JSON.stringify({
      ok: false,
      error: "Championship not found"
    }), { headers });
  }

  return new Response(JSON.stringify({
    ok: true,
    championship
  }), { headers });
}

if (url.pathname === "/api/finish-challenge" && request.method === "POST") {
  let data = {};
  try {
    const bodyText = await request.text();
    data = bodyText ? JSON.parse(bodyText) : {};
  } catch (e) {
    data = {};
  }

  const roomCode = normalizeRoomCode(data.room_code);

  if (!roomCode) {
    return new Response(JSON.stringify({
      ok: false,
      error: "room_code is required"
    }), { headers });
  }

  await env.DB.prepare(`
    UPDATE Championships
    SET challenge_finished = 1,
        status = 'Finished'
    WHERE room_code = ?
  `).bind(roomCode).run();

  return new Response(JSON.stringify({
    ok: true,
    message: "Challenge finished",
    room_code: roomCode,
    challenge_finished: 1
  }), { headers });
}


if (url.pathname === "/api/save-round" && request.method === "POST") {
  let data = {};
  try {
    const bodyText = await request.text();
    data = bodyText ? JSON.parse(bodyText) : {};
  } catch (e) {
    data = {};
  }

  const roomCode = normalizeRoomCode(data.room_code || url.searchParams.get("room_code"));
  const roundNumber = Number(data.round_number || url.searchParams.get("round_number") || 1);

  if (!roomCode) {
    return new Response(JSON.stringify({
      ok: false,
      error: "room_code is required"
    }), { headers });
  }

  const updateResult = await env.DB.prepare(`
    UPDATE Results
    SET official_saved = 1
    WHERE round_number = ?
      AND student_id IN (
        SELECT id FROM Students WHERE room_code = ?
      )
  `).bind(roundNumber, roomCode).run();

  return new Response(JSON.stringify({
    ok: true,
    message: "Round results officially saved",
    room_code: roomCode,
    round_number: roundNumber,
    official_saved: 1,
    changed: updateResult.meta && typeof updateResult.meta.changes !== "undefined" ? updateResult.meta.changes : null
  }), { headers });
}

    return new Response(JSON.stringify({
      ok: false,
      error: "Endpoint not found"
    }), { status: 404, headers });
  }
};