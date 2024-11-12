import axios from "axios";

const windToMs = (wind) => parseFloat(wind / 3.6).toFixed(2);

const tommorow = new Promise(async (resolve, reject) => {
    try {
        const resp = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=99f67e7810d6474b86095041241110&q=Moscow&days=2&aqi=no&alerts=no`)
        const {
            mintemp_c: minTemp,
            maxtemp_c: maxTemp,
            avghumidity: humidity, 
            maxwind_kph: wind,
            daily_will_it_rain,
            daily_chance_of_rain,
            daily_will_it_snow,
            daily_chance_of_snow,
        } = resp.data.forecast.forecastday[1].day;
        const windMS = windToMs(wind);
        const {icon} = resp.data.forecast.forecastday[1].day.condition;

        const rainChance = Math.max(daily_will_it_rain, daily_chance_of_rain, daily_will_it_snow, daily_chance_of_snow)

        resolve({
            minTemp,
            maxTemp,
            humidity,
            windMS,
            rainChance,
            icon,
        })

    } catch (e) {
        reject({
            error: 'Сервис погоды недоступен'
        })
    }
})

const today = new Promise(async (resolve, reject) => {
    try {
        const resp = await axios.get(`http://api.weatherapi.com/v1/current.json?key=99f67e7810d6474b86095041241110&q=Moscow&aqi=no`)
        const {
            temp_c: temp,
            humidity, 
            wind_kph: wind,
        } = resp.data.current;
        const windMS = windToMs(wind);
        const {icon} = resp.data.current.condition;

        resolve({
            temp,
            humidity,
            windMS,
            icon,
        })

    } catch (e) {
        reject({
            error:'Сервис погоды недоступен'
        })
    }
})


export default {
    tommorow, today
}





