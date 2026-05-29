const { v4: uuidv4 } = require("uuid");
const { QueryTypes } = require("sequelize");
const { db } = require("./../src/infrastructure/audit/sequelize-schema");

const INVITE_CREATED_RE =
  /Invitation code is created\. Id ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

const USER_INVITE_ORG_RE =
  /to invitation for .+ \(id: ([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/i;

const findMissingEditedUser = async (subType) =>
  db.query(
    `SELECT AL.id, COALESCE(ALM.[value], AL.message) AS message
     FROM AuditLogs AL
     LEFT JOIN AuditLogMeta ALM ON ALM.auditId = AL.id AND ALM.[key] = 'message'
     WHERE AL.subType = :subType
       AND NOT EXISTS (
         SELECT 1 FROM AuditLogMeta ALM2
         WHERE ALM2.auditId = AL.id AND ALM2.[key] = 'editedUser'
       )`,
    { type: QueryTypes.SELECT, replacements: { subType } },
  );

const insertEditedUser = async (auditId, editedUser) =>
  db.query(
    `INSERT INTO AuditLogMeta (id, auditId, [key], [value])
     VALUES (:id, :auditId, 'editedUser', :editedUser)`,
    {
      type: QueryTypes.INSERT,
      replacements: { id: uuidv4(), auditId, editedUser },
    },
  );

const backfill = async () => {
  let fixed = 0;
  let skipped = 0;

  const inviteCreatedRows = await findMissingEditedUser("invite-created");
  console.log(
    `invite-created records missing editedUser: ${inviteCreatedRows.length}`,
  );
  for (const row of inviteCreatedRows) {
    if (!row.message) {
      console.warn(`  skipped invite-created ${row.id}: message is null`);
      skipped++;
      continue;
    }
    const match = INVITE_CREATED_RE.exec(row.message);
    if (match) {
      await insertEditedUser(row.id, `inv-${match[1]}`);
      console.log(`  fixed invite-created ${row.id} -> inv-${match[1]}`);
      fixed++;
    } else {
      console.warn(
        `  skipped invite-created ${row.id}: could not parse GUID from message`,
      );
      skipped++;
    }
  }

  const userInviteOrgRows = await findMissingEditedUser("user-invite-org");
  console.log(
    `user-invite-org records missing editedUser: ${userInviteOrgRows.length}`,
  );
  for (const row of userInviteOrgRows) {
    if (!row.message) {
      console.warn(`  skipped user-invite-org ${row.id}: message is null`);
      skipped++;
      continue;
    }
    const match = USER_INVITE_ORG_RE.exec(row.message);
    if (match) {
      await insertEditedUser(row.id, `inv-${match[1]}`);
      console.log(`  fixed user-invite-org ${row.id} -> inv-${match[1]}`);
      fixed++;
    } else {
      console.warn(
        `  skipped user-invite-org ${row.id}: could not parse GUID from message`,
      );
      skipped++;
    }
  }

  console.log(`\nDone. Fixed: ${fixed}, Skipped: ${skipped}`);
};

backfill()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
