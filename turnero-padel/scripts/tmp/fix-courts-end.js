require('dotenv').config({ path: '.env.local' })
require('dotenv').config()
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

(async function () {
  try {
    const courts = await prisma.court.findMany({
      select: { id: true, name: true, operatingHours: true, isActive: true }
    });

    for (const c of courts) {
      let oh = null;
      try {
        oh = typeof c.operatingHours === 'string' ? JSON.parse(c.operatingHours) : c.operatingHours;
      } catch (e) {}

      const end = (oh && (oh.end || oh.close)) || null;
      const duration = (oh && oh.slot_duration) || null;

      const needsUpdate = c.isActive && end && end !== '23:00';
      if (!needsUpdate) {
        console.log(`Skip: ${c.id} | ${c.name} | end=${end}`);
        continue;
      }

      const newHours = {
        start: (oh && oh.start) || (oh && oh.open) || '08:00',
        end: '23:00',
        slot_duration: duration || 90
      };

      console.log(`Update: ${c.id} | ${c.name} | end ${end} -> 23:00`);
      await prisma.court.update({
        where: { id: c.id },
        data: { operatingHours: JSON.stringify(newHours) }
      });
    }

    console.log('Done fixing end times to 23:00');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();