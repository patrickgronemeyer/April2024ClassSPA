import Navigo from "navigo";
import { camelCase } from "lodash";
import { header, nav, main, footer } from "./components";
import * as store from "./store";
import axios from "axios"

const router = new Navigo("/");

function render(state = store.home) {
  document.querySelector("#root").innerHTML = `
    ${header(state)}
    ${nav(store.nav)}
    ${main(state)}
    ${footer()}
  `;
  router.updatePageLinks();
  
  afterRender();
}

function afterRender() {
  // add menu toggle to bars icon in nav bar
  document.querySelector(".fa-bars").addEventListener("click", () => {
    document.querySelector("nav > ul").classList.toggle("hidden--mobile");
  });
}

// https://api.openweathermap.org/data/2.5/weather?q=St. Louis&APPID=771aad5976b3b53b8c1d66e78992161f


// 'https://api.openweathermap.org/data/2.5/weather?q=St. Louis&APPID=${process.env.OPEN_WEATHER_MAP_API_KEY}&q=st%20louis`)'

router.hooks({
  before: (done, params) => {
    // We need to know what view we are on to know what data to fetch
    const view = params && params.data && params.data.view ? camelCase(params.data.view) : "home";
    // Add a switch case statement to handle multiple routes
    switch (view) {
      // Add a case for each view that needs data from an API
      case "home":
  axios
    // Get request to retrieve the current weather data using the API key and providing a city name
    .get(
      `https://api.openweathermap.org/data/2.5/weather?appid=${process.env.OPEN_WEATHER_MAP_API_KEY}&units=imperial&q=st%20louis`
    )
    .then(response => {
      console.log("Weather Data", response.data);
      // Create an object to be stored in the Home state from the response
      store.home.weather = {
        city: response.data.name,
        temp: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        description: response.data.weather[0].main
      };

      // An alternate method would be to store the values independently
      
      // store.Home.weather.city = response.data.name;
      // store.Home.weather.temp = kelvinToFahrenheit(response.data.main.temp);
      // store.Home.weather.feelsLike = kelvinToFahrenheit(response.data.main.feels_like);
      // store.Home.weather.description = response.data.weather[0].main;
      
      done();
  })
  .catch((err) => {
    console.log(err);
    done();
  });
  break;

      case "pizza":
        // New Axios get request utilizing already made environment variable
        axios
          .get(`${process.env.PIZZA_PLACE_API_URL}/pizzas`)
          .then(response => {
            // We need to store the response to the state, in the next step but in the meantime let's see what it looks like so that we know what to store from the response.
            console.log("response", response);
            
            // Storing retrieved data in state
            // The dot chain variable access represents the following {storeFolder.stateFileViewName.objectAttribute}
            store.pizza.pizzas = response.data;
            done();
          })
          .catch((error) => {
            console.log("It puked", error);
            done();
          });
          break;
      default :
        done();
    }
  },
  already: (params) => {
    const view = params && params.data && params.data.view ? camelCase(params.data.view) : "home";

    render(store[view]);
  }
});

router
.on({
  "/": () => render(),
  // Use object destructuring assignment to store the data and (query)params from the Navigo match parameter
  // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
  // This reduces the number of checks that need to be performed
  ":view": ({ data, params }) => {
    // Change the :view data element to camel case and remove any dashes (support for multi-word views)
    const view = data?.view ? camelCase(data.view) : "home";
    if (view in store) {        
      render(store[view]);
    } else {
      render(store.viewNotFound);
      console.log(`View ${view} not defined`);
    }
  },
})
.resolve();