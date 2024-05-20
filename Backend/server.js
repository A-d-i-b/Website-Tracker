const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const app = express();
const port = 3000;
const { title } = require('process');
app.use(cors());
app.use(bodyParser.json());
const db = mysql.createConnection({
  host: 'sql12.freesqldatabase.com',   
  user: 'sql12707339',    
  password: 'MKUY2niJ8C', 
  database: 'sql12707339' 
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database.');
});

app.post('/api/user/email', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required' });
  }
  db.query('INSERT INTO users (email) VALUES (?)', [email], (err, result) => {
    if (err) {
      console.error('Error storing email address:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log('Email address stored successfully');
    res.status(200).send('Email address stored successfully');
  });
});


app.get('/api/time_spent/:email/:domain/:todayDate', (req, res) => {
  const { email, domain ,todayDate} = req.params;
  const query = 'SELECT time_spent FROM time_tracker WHERE email = ? AND domain = ? AND date = ?';
  db.query(query, [email, domain,todayDate], (err, results) => {
      if (err) {
          console.error('Error fetching time spent:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
      }
      if (results.length > 0) {
          res.json({ time_spent: results[0].time_spent });
      } else {
          res.json({ time_spent: 0 });
      }
  });
});


app.get('/api/data/:email', (req, res) => {
  const email=req.params.email;
  const date = req.query.date;
  let query = 'SELECT * FROM time_tracker WHERE email = ?'; // Replace with your table name
  const queryParams = [email];
  if (date) {
    query += ` AND date = ?`;
    queryParams.push(date);
  }
  db.query(query,queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});


app.post('/api/data', (req, res) => {
  const { domain, timeSpent, userEmail, todayDate } = req.body;

  
  const queryCheck = `
    SELECT * FROM time_tracker WHERE email = ? AND domain = ? AND date = ?
  `;

  db.query(queryCheck, [userEmail, domain,todayDate], (err, results) => {
    if (err) {
      console.error('Error checking existing record:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length > 0) {
      
      const existingRecord = results[0];
      const newTimeSpent = existingRecord.time_spent + timeSpent;

      const queryUpdate = `
        UPDATE time_tracker SET time_spent = ? WHERE id = ?
      `;

      db.query(queryUpdate, [newTimeSpent, existingRecord.id], (err, results) => {
        if (err) {
          console.error('Error updating existing record:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        res.json({ message: 'Data updated successfully', id: existingRecord.id });
      });
    } else {
      
      const queryInsert = `
        INSERT INTO time_tracker (domain, time_spent, email, date) VALUES (?, ?, ?,?)
      `;

      db.query(queryInsert, [domain, timeSpent, userEmail,todayDate], (err, results) => {
        if (err) {
          console.error('Error inserting new record:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        res.json({ message: 'New data inserted successfully', id: results.insertId });
      });
    }
  });
});
app.post('/api/restricted-sites', (req, res) => {
  const { siteUrl ,userEmail} = req.body;
  const query = 'INSERT INTO restricted_sites (url,email) VALUES (?,?)';
  db.query(query, [siteUrl,userEmail], (err, result) => {
    if (err) {
      console.error('Error adding site to restricted list:', err);
      res.status(500).send('Internal server error');
    } else {
      res.status(201).send('Site added to restricted list');
    }
  });
});
app.get('/api/restricted-sites/:email', (req, res) => {
  let useremail=req.params.email;
  const query = 'SELECT url FROM restricted_sites WHERE email = ?';
  db.query(query,[useremail] ,(err, results) => {
    if (err) {
      console.error('Error fetching restricted sites:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(results);
    }
  });
});
app.delete('/api/restricted-sites', (req, res) => {
  const { siteUrl,userEmail } = req.body;
  const query = 'DELETE FROM restricted_sites WHERE url = ? AND email = ?';
  db.query(query, [siteUrl,userEmail], (err, result) => {
    if (err) {
      console.error('Error removing site from restricted list:', err);
      res.status(500).send('Internal server error');
    } else {
      res.status(200).send('Site removed from restricted list');
    }
  });
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
