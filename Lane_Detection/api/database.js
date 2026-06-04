const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

function initDB(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS detection (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_width INTEGER NOT NULL,
      image_height INTEGER NOT NULL,
      canny_low INTEGER,
      canny_high INTEGER,
      hough_threshold INTEGER,
      ransac_iterations INTEGER,
      ransac_distance REAL,
      nms_window INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS line_segment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      detection_id INTEGER NOT NULL,
      rho REAL NOT NULL,
      theta REAL NOT NULL,
      start_x REAL,
      start_y REAL,
      end_x REAL,
      end_y REAL,
      votes INTEGER,
      is_false_positive INTEGER DEFAULT 0,
      false_reason TEXT,
      FOREIGN KEY (detection_id) REFERENCES detection(id)
    );

    CREATE TABLE IF NOT EXISTS accumulator_snapshot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      detection_id INTEGER NOT NULL,
      rho_bins INTEGER NOT NULL,
      theta_bins INTEGER NOT NULL,
      data BLOB NOT NULL,
      FOREIGN KEY (detection_id) REFERENCES detection(id)
    );
  `);

  return db;
}

function saveDetection(imageWidth, imageHeight, params, lines, accumulator, rhoBins, thetaBins) {
  if (!db) throw new Error('Database not initialized');

  const insertDetection = db.prepare(`
    INSERT INTO detection (image_width, image_height, canny_low, canny_high, hough_threshold, ransac_iterations, ransac_distance, nms_window)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLine = db.prepare(`
    INSERT INTO line_segment (detection_id, rho, theta, start_x, start_y, end_x, end_y, votes, is_false_positive, false_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAccumulator = db.prepare(`
    INSERT INTO accumulator_snapshot (detection_id, rho_bins, theta_bins, data)
    VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const result = insertDetection.run(
      imageWidth, imageHeight,
      params.cannyLow, params.cannyHigh, params.houghThreshold,
      params.ransacIter, params.ransacDist, params.nmsWindow
    );
    const detectionId = result.lastInsertRowid;

    for (const line of lines) {
      insertLine.run(
        detectionId, line.rho, line.theta,
        line.startX, line.startY, line.endX, line.endY,
        line.votes, line.isFalsePositive ? 1 : 0, line.falseReason || null
      );
    }

    const accBuf = Buffer.from(accumulator.buffer, accumulator.byteOffset, accumulator.byteLength);
    insertAccumulator.run(detectionId, rhoBins, thetaBins, accBuf);

    return detectionId;
  });

  return transaction();
}

function getHistory(limit) {
  if (!db) throw new Error('Database not initialized');
  if (limit === undefined) limit = 20;

  const detections = db.prepare(`
    SELECT id, image_width, image_height, canny_low, canny_high, hough_threshold,
           ransac_iterations, ransac_distance, nms_window, created_at
    FROM detection ORDER BY created_at DESC LIMIT ?
  `).all(limit);

  const getLines = db.prepare(`
    SELECT rho, theta, start_x, start_y, end_x, end_y, votes, is_false_positive, false_reason
    FROM line_segment WHERE detection_id = ?
  `);

  return detections.map(d => ({
    id: d.id,
    imageWidth: d.image_width,
    imageHeight: d.image_height,
    params: {
      cannyLow: d.canny_low,
      cannyHigh: d.canny_high,
      houghThreshold: d.hough_threshold,
      ransacIter: d.ransac_iterations,
      ransacDist: d.ransac_distance,
      nmsWindow: d.nms_window
    },
    lines: getLines.all(d.id).map(l => ({
      rho: l.rho,
      theta: l.theta,
      startX: l.start_x,
      startY: l.start_y,
      endX: l.end_x,
      endY: l.end_y,
      votes: l.votes,
      isFalsePositive: !!l.is_false_positive,
      falseReason: l.false_reason
    })),
    createdAt: d.created_at
  }));
}

module.exports = { initDB, saveDetection, getHistory };
