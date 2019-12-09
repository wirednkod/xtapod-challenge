
exports.main = function($P){
  console.log($P.userID);
  $P.exports.userID = $P.userID;
  $P.render();
};

