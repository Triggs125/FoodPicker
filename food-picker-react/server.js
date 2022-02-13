const express = require('express');
const app = express();
const cors = require('cors')({origin: true});
app.use(cors);
const port = process.env.PORT || 5050;
const axios = require('axios');

app.listen(port, () => console.log(`Listening on port ${port}`));

app.get('/nearbysearch', (req, res) => {
  const { location, radius, types } = req.body;
  axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
    + `location=${location.latitude},${location.longitude}`
    + `&radius=${radius}`
    + `&types=${types}`
    + '&key=AIzaSyABLEWTpgnHhloYv_JH301853XGEhVDpMc'
  ).then(response => {
    if (response.status === 200) {
      result = response;
      console.log(result.data);
      res.send(result.data);
    }
    console.log("Nearby search::Non 200 response", response);
    res.status(500).send();
  }).catch(err => {
    console.error("Nearby search::error", err);
    res.status(500).send();
  });
});

app.get('/photo', (req, res) => {
  const { photo_reference, maxWidth } = req.body;
})
