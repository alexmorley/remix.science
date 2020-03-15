#!/bin/bash
SESSION=remix

tmux -2 new-session -d -s $SESSION

# set up app window
tmux new-window -t $SESSION:2 -n 'app'
tmux split-window -h
tmux select-pane -t 0
tmux send-keys "cd app && npm run dev" C-m

# set up kbucket moving parts window
tmux new-window -t $SESSION:3 -n 'kbucket'
tmux send-keys "mkdir -p ~/.scratch && \cp -Rf develop.scratch/* ~/.scratch/" C-m
tmux split-window -h
tmux split-window -h

## kbucket hub pane
tmux select-pane -t 0
tmux send-keys "cd ~/.scratch/temporay1 && kbucket-hub --auto" C-m

## lari hub pane
tmux select-pane -t 1
tmux send-keys "cd ~/.scratch/temporary2 && lari-hub --auto" C-m

## lari host pane
tmux select-pane -t 2
tmux send-keys "cd ~/.scratch/temporary3 && ML_CONFIG_FILE=$HOME/.mountainlab/mountainlab.env lari-host --auto" C-m
tmux select-layout even-horizontal

tmux select-window -t $SESSION:3

tmux -2 attach-session -t $SESSION
