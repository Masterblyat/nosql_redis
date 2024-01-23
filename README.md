# TP NOSQL
## Louis Toulemon, Louis Couach, Morgan DAYNES, Hicham SOUSSI

## Installation

### Prérequis

- Docker
- Docker-compose
- NodeJS

### Configuration

Edit the `.env` file to change the token of the bot.
Run `npm install` to install dependencies
Run `npm run build` to build the bot.


### Lancement

- `docker-compose up -d`
- `npm start`


### Mongo structure
#### Collection: global_leaderboard
```json
{
    "userId": "string",
    "date": 123456789 // timestamp
}
```
#### Collection: custom_commands
```json
{
    "name": "string",
    "description": "string",
    "content": "string"
}
```