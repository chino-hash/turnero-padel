const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

(async function () {
  try {
    const courts = await prisma.court.findMany({
      select: { id: true, name: true, operatingHours: true, isActive: true }
    });
    courts.forEach(c => {
      let end = null;
      let duration = null;
      try {
        const oh = typeof c.operatingHours === 'string' ? JSON.parse(c.operatingHours) : c.operatingHours;
        end = (oh && (oh.end || oh.close)) || null;
        duration = (oh && oh.slot_duration) || null;
      } catch (e) {}
      console.log([c.id, c.name, 'active=' + c.isActive, 'end=' + end, 'duration=' + duration, 'raw=' + c.operatingHours].join('\t'));
    });
    process.exit(0);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();