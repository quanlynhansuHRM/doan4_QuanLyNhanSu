module.exports = async function logAudit(
  db,
  { actionType, tableName, recordId, performedBy, changes }
) {
  const sql = `
    INSERT INTO audit_logs (action_type, table_name, record_id, performed_by, changes)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    actionType,
    tableName,
    recordId || null,
    performedBy,
    JSON.stringify(changes || {}),
  ];
  await db.execute(sql, values);
};
