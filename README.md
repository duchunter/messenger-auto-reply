# Facebook Messenger Bot
![Demo image](https://image.ibb.co/gakSO8/Screenshot_from_2018_05_19_23_27_50.png)
<br/>
- Tell people that you are busy at the momment or having internet connection problems even when you are offline :)
- Customizable message and duration
- Support Facebook 2-factors authentication only
- Run on cloud platform -> you can turn on anywhere, anytime
- Using Dialogflow SmallTalk feature, sender can chat with this bot instead of just leaving a message :)
>This guide is for Heroku only, other platforms may follow the same process

### 1. 3rd parties

* Dialogflow:
	* Enable Small Talk feature and get an API key
	* Create ```server/utils/apiaiConfig.js```:

		```javascript
        module.exports = 'YOUR_API_KEY';
        ```
* Auth0:
	* Create ```server/utils/auth0Config.js``` and get these values:

    ```javascript
    const AUTH0_JWKS_URI = "";
	const AUTH0_AUDIENCE = "";
	const AUTH0_ISSUER = "";
	const AUTH0_ALGORITHMS = "RS256";

	export default { AUTH0_JWKS_URI, AUTH0_AUDIENCE, AUTH0_ISSUER, AUTH0_ALGORITHMS }
    ```

### 2. Server setup

- Install postgres add-ons for your Heroku project
- Setup database using content in ```db.sql```
- Add your account to database:
```sql
insert into Accounts (email, password) values ('YOUR_EMAIL', 'YOUR_PASSWORD');
```
>Your Facebook account must have 2 factors authentication enabled

### 3. Build Setup
- Create ```.env``` with 1 line: ```BOT_URL=https://[YOUR_BOT_URL].herokuapp.com```
- Open ```server/routes/index.js``` and comment as guided in line 10 and line 34
- Install dependencies and build file:
``` bash
npm install
npm run build
```
- Copy ```/build```, ```package.json```, ```package-lock.json``` to Heroku project folder (Heroku only needs these things)
- Push to Heroku

### 4. Using bot
- Use [bot-manager app](https://github.com/duchunter/bot-manager) :)
- Or simply send an api containing authentication header (Bearer 'access_token') + data required to a specific route
