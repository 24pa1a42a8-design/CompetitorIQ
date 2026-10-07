import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testRepeatComparison() {
  const competitorCombos = [
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'f131a513-f939-44eb-a830-1bfaf56ed35f'], // AWS + Google Cloud
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'd61ea60c-312c-457d-960b-a063ab75321d'], // AWS + IBM
    ['9985d6a4-3012-494d-bea4-bb12bc2eb500', 'ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10'], // Microsoft + AWS
    ['9985d6a4-3012-494d-bea4-bb12bc2eb500', 'f131a513-f939-44eb-a830-1bfaf56ed35f', 'd61ea60c-312c-457d-960b-a063ab75321d'], // Microsoft + Google Cloud + IBM
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'f131a513-f939-44eb-a830-1bfaf56ed35f', 'd61ea60c-312c-457d-960b-a063ab75321d', '9985d6a4-3012-494d-bea4-bb12bc2eb500'], // AWS, Google Cloud, IBM, Microsoft
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'f131a513-f939-44eb-a830-1bfaf56ed35f', 'd61ea60c-312c-457d-960b-a063ab75321d', '9985d6a4-3012-494d-bea4-bb12bc2eb500', 'a3434180-9046-436d-ab42-a8061fb260e2', '3df44c7e-9aca-41d9-b360-74c24cba3226'], // All 6 competitors
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'f131a513-f939-44eb-a830-1bfaf56ed35f', 'd61ea60c-312c-457d-960b-a063ab75321d', '9985d6a4-3012-494d-bea4-bb12bc2eb500'],
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'f131a513-f939-44eb-a830-1bfaf56ed35f', 'd61ea60c-312c-457d-960b-a063ab75321d', '9985d6a4-3012-494d-bea4-bb12bc2eb500'],
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'f131a513-f939-44eb-a830-1bfaf56ed35f', 'd61ea60c-312c-457d-960b-a063ab75321d', '9985d6a4-3012-494d-bea4-bb12bc2eb500'],
    ['ff3aa1f3-37ee-41c6-b1cb-78cfb6f88d10', 'f131a513-f939-44eb-a830-1bfaf56ed35f', 'd61ea60c-312c-457d-960b-a063ab75321d', '9985d6a4-3012-494d-bea4-bb12bc2eb500']
  ];

  console.log('--- RUNNING 10 REPEATED COMPARISON TESTS ---');
  let passCount = 0;

  for (let i = 0; i < competitorCombos.length; i++) {
    const ids = competitorCombos[i].join(',');
    const url = `${BASE_URL}/competitive-comparison?competitorIds=${ids}&windowDays=90`;
    const start = Date.now();
    try {
      const res = await fetch(url, { headers: { 'x-organization-id': 'default-org' } });
      const duration = Date.now() - start;
      const data = await res.json();
      if (res.status === 200 && data.success) {
        passCount++;
        console.log(`[TEST ${i + 1}/10 PASSED] (${duration}ms) — Competitors count in matrix: ${data.data?.competitors?.length || 0}`);
      } else {
        console.error(`[TEST ${i + 1}/10 FAILED] HTTP ${res.status}`);
      }
    } catch (err) {
      console.error(`[TEST ${i + 1}/10 ERROR] ${err.message}`);
    }
  }

  console.log(`\nFinal Result: ${passCount}/10 tests passed successfully!`);
}

testRepeatComparison();
