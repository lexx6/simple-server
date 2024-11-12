import express from "express"
import cors from "cors"
import bodyParser from "body-parser"
import MD5 from "crypto-js/md5.js"
import weather from "./scripts/weather.js"
import sqlite3 from "sqlite3"

// const db = new sqlite3
const db = new (sqlite3.verbose()).Database('my.db', (error) => {
    if (error) return console.error(error.message)
    console.log('Connected to the SQLIte database.')
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        token TEXT NOT NULL
    )`)
})

// 'SELECT * FROM users'
// 'INSERT INTO tablename'
// 'DELETE FROM users'
// `UPDATE users`
// реаляционная -> sql (postresql, mariadb, mysql, sqlite)
// нереаляционная -> (nosql) mongodb

const app = express()
const port = 3000

const jsonParser = bodyParser.json()
app.use(jsonParser);

app.use(cors())

const auth = (req) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', (error, result) => {
            if (error) {
                console.error('Error during users request from DB')
                resolve(false)
            }
            if(!!result.filter((user) => user.token === req.headers.authorization).length) {
                resolve(true)
            } else {
                resolve(false)
            }       
        })
    })
}

const login = (username, password) => {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM users', (error, users) => {
            if (error) {
                console.error('Error during users request from DB')
                resolve(false)
            }
            if(!!users.filter((user) => user.name === username && user.password === password).length) {
                resolve(users.find((user) => user.name === username && user.password === password))
            } else {
                resolve(false)
            }       
        })
    })
}

const accessDeniedMessage = {'error':'access denied'}


app.get('/api/weather/tommorow', async (req, res) => {
    const access = await auth(req)
    if (!access) return res.status(401).send(accessDeniedMessage)
    weather.tommorow.then(w => res.send(w)).catch(err => res.send(err))
})

app.get('/api/weather/today', async (req, res) => {
    const access = await auth(req)
    if (!access) return res.status(401).send(accessDeniedMessage)
    weather.today.then(w => res.send(w)).catch(err => res.send(err))
})

app.post('/api/auth/signin', async (req, res) => {
    const { password, username } = req.body
    const user = await login(username, password)
    if(user === false) return res.status(401).send()
    return res.send({
        token: user.token,
        username: user.name
    })
})

app.post('/api/ping', async (req, res) => {
    return res.send('pong')
})

app.post('/api/auth/signup', (req, res) => {
    const { password, username } = req.body
    db.all(`SELECT * FROM users WHERE name=?`, [username], (error, users) => {
        if (error) return res.status(500).send()
        if (!!users.length) return res.status(409).send({ error: 'user already exist'})
        db.run(`INSERT INTO users(name,password,token) VALUES (?, ?, ?)`, [username, password, MD5(password).toString()], (error) => {
            if (error) return res.status(500).send()
            res.send({
                token: MD5(password).toString(),
                username
            })
        })
    })
    
})

app.listen(port, () => {
    console.log(`Запущен и слушает порт ${port}`)
})



// const WheatherTommorow = async (ctx) => {
//     try {
//         const resp = await axios.get(`https://api.weatherapi.com/v1/forecast.json?key=99f67e7810d6474b86095041241110&q=Moscow&days=2&aqi=no&alerts=no`)
//         const {
//             mintemp_c: minTemp,
//             maxtemp_c: maxTemp,
//             avghumidity: humidity, 
//             maxwind_kph: wind,
//             daily_will_it_rain,
//             daily_chance_of_rain,
//             daily_will_it_snow,
//             daily_chance_of_snow,
//         } = resp.data.forecast.forecastday[1].day;
//         const windMS = parseFloat(wind / 3.6).toFixed(2);
//         const {icon} = resp.data.forecast.forecastday[1].day.condition;

//         const rainChance = Math.max(daily_will_it_rain, daily_chance_of_rain, daily_will_it_snow, daily_chance_of_snow)

//         const caption = [
//             `Погода завтра в Москве:`,
//             `Температура: от ${minTemp}°С до ${maxTemp}°С`,
//             `Влажность: ${humidity}%`,
//             `Скорость ветра: ${windMS} м/с`,
//             `Вероятность осадков: ${rainChance}%`,
//         ].join('\n')

//     } catch (e) {
//         await ctx.reply('Сервис погоды недоступен')
//     }
// }

// const WheatherToday = async (ctx) => {
//     try {
//         const resp = await axios.get(`http://api.weatherapi.com/v1/current.json?key=99f67e7810d6474b86095041241110&q=Moscow&aqi=no`)
//         const {
//             temp_c: temp,
//             humidity, 
//             wind_kph: wind,
//         } = resp.data.current;
//         const windMS = parseFloat(wind / 3.6).toFixed(2);
//         const {icon} = resp.data.current.condition;

//         const caption = [
//             `Погода сегодня в Москве:`,
//             `Температура: ${temp}°С`,
//             `Влажность: ${humidity}%`,
//             `Скорость ветра: ${windMS} м/с`,
//         ].join('\n')

//         await ctx.api.sendPhoto(ctx.chat.id, `https:${icon}`, {
//             reply_parameters: { message_id: ctx.msg.message_id },
//             caption,
//         })

//     } catch (e) {
//         console.log(e)
//         await ctx.reply('Сервис погоды недоступен')
//     }
// }
