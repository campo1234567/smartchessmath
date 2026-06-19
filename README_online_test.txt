SmartChessMath Knight Online Test

File to upload for testing:
- knight-online-test.html

Suggested test URL:
https://smartchessmath.com/knight-online-test

Do not replace the current knight.html yet.

What was added:
- Online API base: https://smartchessmath-api.campo1234567.workers.dev
- Teacher Create Room calls /api/create-championship
- Student Join Room calls /api/join-room
- Teacher room list refresh calls /api/room-students
- Student result submission calls /api/save-result

Known limitation of this step:
- Start Round is still local/BroadcastChannel-based. For true simultaneous start across distant devices, the next step is /api/start-round + /api/room-status.
