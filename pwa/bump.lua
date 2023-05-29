for str in io.lines() do
  if str:match('^const version = ') then
    local t = os.date('!*t')
    str = string.format("const version = '%04d-%02d-%02d:%02d:%02d:%02d';", t.year, t.month, t.day, t.hour, t.min, t.sec)
  end
  io.write(str, '\n')
end
