fetch('http://localhost:8000/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test Student Grade4', gradeId: 'grade4' })
}).then(r => r.json()).then(d => {
  console.log('Response:', d);
  if (d.gradeId) {
    console.log('SUCCESS: gradeId is saved correctly:', d.gradeId);
  } else {
    console.log('ISSUE: gradeId not in response, but may still be saved in DB');
  }
}).catch(console.error);
