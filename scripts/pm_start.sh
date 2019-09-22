#!/bin/bash
export DB_HOST=localhost 
export DB_USER=test
export DB_PASSWORD=test 
export DB_DATABASE=replecon
export DB_SOCK=/var/run/mysqld/mysqld.sock
cd ..
pm2 start app.js