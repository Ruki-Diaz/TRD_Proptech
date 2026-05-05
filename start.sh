#!/bin/bash

cd ~/Documents/TRD_Proptech/backend || exit
source venv/bin/activate
python3 run.py &

cd ~/Documents/TRD_Proptech/frontend || exit
npm run dev