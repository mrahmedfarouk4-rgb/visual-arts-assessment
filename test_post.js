fetch('http://localhost:8000/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test', gradeId: 'grade4' })
}).then(r => r.text()).then(console.log).catch(console.error);
