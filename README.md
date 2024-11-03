# <img src="client/public/favicon.svg" alt="Favicon" width="30px" style="filter: invert(0.5)"> CP Buddy - 1v1 DSA Battle

This web application lets you have a 1v1 DSA Battle. Faster ones wins the game.


## Authors

- [@devSuryansh](https://www.github.com/devSuryansh)
- [@igennova](https://www.github.com/igennova)


## Environment Variables

To run this project, you will need to add the following environment variables to your *./server/.env* file

`MONGODB_URL`

`JUDGE_KEY`


## Run Locally

Clone the project

```bash
  git clone https://github.com/devSuryansh/cp-meet.git
```

Go to the project directory

```bash
  cd cp-meet
```

Install dependencies for both client and server

```bash
  cd client; npm i; cd ..; cd server; npm i
```

Start the project `./client`

```bash
  npm run dev
```

Start the server `./server`

```bash
  npm run start
```