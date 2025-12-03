import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:8001')
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.log("Error fetching data: ", error);
      });
  }, []);

  return (
    <div className="App">
      <h1>{message ? message : "Loading..."}</h1>
    </div>
  );
}

export default App;