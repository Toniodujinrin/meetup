const res = [1, 2, 3, , 54].reduce((previous, current) => {
  return (current = previous + current);
});
console.log(res);
