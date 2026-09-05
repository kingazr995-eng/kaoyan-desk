on run
	set serverUp to false
	try
		set httpCode to do shell script "curl -s -o /dev/null -w '%{http_code}' -m 3 http://localhost:3000/"
		if httpCode is "200" then set serverUp to true
	end try
	if not serverUp then
		do shell script "cd /Users/a1-6/Documents/12/duty-desk && nohup npm start > /tmp/desk-server.log 2>&1 &"
		delay 6
	end if
	do shell script "open http://localhost:3000"
end run
