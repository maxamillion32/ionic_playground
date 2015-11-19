angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, $state, Chats, BoardPopup) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.allChats();

  $scope.newBoard = function() {
    BoardPopup().then(function(name) {
        if (name) {
          $state.go('^.chat-detail', { chatId: name });
        }
    });
  }
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  var chatId = $stateParams.chatId,
      chat = Chats.getChat(chatId);

  $scope.name = chatId;
  $scope.messages = chat.messages();

  $scope.sendMessage = function(messageBody) {
    chat.sendMessage('nathan', messageBody);
    $scope.message = '';
  };
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
