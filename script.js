// Global Variables
var direction = {
  idle: 0,
  up: 1,
  down: 2,
  left: 3,
  right: 4
};

var rounds = [5, 5, 3, 3, 2];
var colors = ['#1abc9c', '#2ecc71', '#3498db', '#8c52ff', '#9b59b6'];

// O objeto da bola (O cubo que quica para trás e para frente)
var Ball = {
  new: function (incrementedSpeed) {
      return {
          width: 18,
          height: 18,
          x: (this.canvas.width / 2) - 9,
          y: (this.canvas.height / 2) - 9,
          moveX: direction.idle,
          moveY: direction.idle,
          speed: incrementedSpeed || 7 
      };
  }
};

// O objeto da inteligência artificial (As duas linhas que movem para cima e para baixo)
var Ai = {
  new: function (side) {
      return {
          width: 18,
          height: 180,
          x: side === 'left' ? 150 : this.canvas.width - 150,
          y: (this.canvas.height / 2) - 35,
          score: 0,
          move: direction.idle,
          speed: 8
      };
  }
};

var Game = {
  initialize: function () {
      this.canvas = document.querySelector('canvas');
      this.context = this.canvas.getContext('2d');

      this.canvas.width = 1400;
      this.canvas.height = 1000;

      this.canvas.style.width = (this.canvas.width / 2) + 'px';
      this.canvas.style.height = (this.canvas.height / 2) + 'px';

      this.player = Ai.new.call(this, 'left');
      this.ai = Ai.new.call(this, 'right');
      this.ball = Ball.new.call(this);

      this.ai.speed = 5;
      this.running = this.over = false;
      this.turn = this.ai;
      this.timer = this.round = 0;
      this.color = '#8c52ff';

      Pong.menu();
      Pong.listen();
  },

  endGameMenu: function (text) {
      // Muda o tamanho da fonte do Canvas e a cor
      Pong.context.font = '45px Courier New';
      Pong.context.fillStyle = this.color;

      // Desenha o retângulo atrás do texto de ''Pressione qualquer tecla para começar''.
      Pong.context.fillRect(
          Pong.canvas.width / 2 - 350,
          Pong.canvas.height / 2 - 48,
          700,
          100
      );

      // Muda a cor do canvas;
      Pong.context.fillStyle = '#ffffff';

      // Desenha o texto de menu de fim de jogo ('Você perdeu!' e 'Você venceu!')
      Pong.context.fillText(text,
          Pong.canvas.width / 2,
          Pong.canvas.height / 2 + 15
      );

      setTimeout(function () {
          Pong = Object.assign({}, Game);
          Pong.initialize();
      }, 3000);
  },

  menu: function () {
      // Desenha todos os objetos Pong nos seus estados atuais.
      Pong.draw();

      // Muda o tamanho da fonte do Canvas e cor.
      this.context.font = '50px Courier New';
      this.context.fillStyle = this.color;

      // Desenha o retângulo atrás do texto de 'Pressione qualquer tecla pra começar'.
      this.context.fillRect(
          this.canvas.width / 2 - 350,
          this.canvas.height / 2 - 48,
          700,
          100
      );

      // Muda a cor do canvas.
      this.context.fillStyle = '#ffffff';

      // Desenha o texto 'Pressione alguma tecla para começar'.
      this.context.fillText('Aperte qualquer tecla para começar',
          this.canvas.width / 2,
          this.canvas.height / 2 + 15
      );
  },

  // Atualiza todos os objetos (move o jogador, IA, bola, aumenta o placar, etc.)
  update: function () {
      if (!this.over) {
          // Se a bola colidir com os limites - corrige as coordenadas x e y.
          if (this.ball.x <= 0) Pong._resetTurn.call(this, this.ai, this.player);
          if (this.ball.x >= this.canvas.width - this.ball.width) Pong._resetTurn.call(this, this.player, this.ai);
          if (this.ball.y <= 0) this.ball.moveY = direction.down;
          if (this.ball.y >= this.canvas.height - this.ball.height) this.ball.moveY = direction.up;

          // Move o jogador se o valor do player.move foi atualizado por um evento de teclado.
          if (this.player.move === direction.up) this.player.y -= this.player.speed;
          else if (this.player.move === direction.down) this.player.y += this.player.speed;

          // Em um novo servidor (começo de cada turno) move a bola para o lado correto.
          // e sorteia a direção para adicionar algum desafio.
          if (Pong._turnDelayIsOver.call(this) && this.turn) {
              this.ball.moveX = this.turn === this.player ? direction.left : direction.right;
              this.ball.moveY = [direction.up, direction.down][Math.round(Math.random())];
              this.ball.y = Math.floor(Math.random() * this.canvas.height - 200) + 200;
              this.turn = null;
          }

          // Se o jogador colidir com os limites do bound, atualiza as cordenadas x e y.
          if (this.player.y <= 0) this.player.y = 0;
          else if (this.player.y >= (this.canvas.height - this.player.height)) this.player.y = (this.canvas.height - this.player.height);

          // Move a bola em direções pretendidas baseadas nos valores de movimentosY e movimentosX.
          if (this.ball.moveY === direction.up) this.ball.y -= (this.ball.speed / 1.5);
          else if (this.ball.moveY === direction.down) this.ball.y += (this.ball.speed / 1.5);
          if (this.ball.moveX === direction.left) this.ball.x -= this.ball.speed;
          else if (this.ball.moveX === direction.right) this.ball.x += this.ball.speed;

          // Controla IA pra cima e pra baixo (movimento).
          if (this.ai.y > this.ball.y - (this.ai.height / 2)) {
              if (this.ball.moveX === direction.right) this.ai.y -= this.ai.speed / 1.5;
              else this.ai.y -= this.ai.speed / 4;
          }
          if (this.ai.y < this.ball.y - (this.ai.height / 2)) {
              if (this.ball.moveX === direction.right) this.ai.y += this.ai.speed / 1.5;
              else this.ai.y += this.ai.speed / 4;
          }

          // Controla colisão de parede da IA.
          if (this.ai.y >= this.canvas.height - this.ai.height) this.ai.y = this.canvas.height - this.ai.height;
          else if (this.ai.y <= 0) this.ai.y = 0;

          // Controla colisões de Jogador-Bola.
          if (this.ball.x - this.ball.width <= this.player.x && this.ball.x >= this.player.x - this.player.width) {
              if (this.ball.y <= this.player.y + this.player.height && this.ball.y + this.ball.height >= this.player.y) {
                  this.ball.x = (this.player.x + this.ball.width);
                  this.ball.moveX = direction.right;

              }
          }

          // Controla colisão de IA-Bola.
          if (this.ball.x - this.ball.width <= this.ai.x && this.ball.x >= this.ai.x - this.ai.width) {
              if (this.ball.y <= this.ai.y + this.ai.height && this.ball.y + this.ball.height >= this.ai.y) {
                  this.ball.x = (this.ai.x - this.ball.width);
                  this.ball.moveX = direction.left;

              }
          }
      }

      // Controla a transição de final de round
      // Veriifque para ver se o jogador venceu o round.
      if (this.player.score === rounds[this.round]) {
          // Verifica se existem rounds/levels restando e demonstra a tela de vitória e
          // se não há
          if (!rounds[this.round + 1]) {
              this.over = true;
              setTimeout(function () { Pong.endGameMenu('Vencedor!'); }, 1000);
          } else {
              // Se tem outro round, reseta todos os valores e acrescenta o numero de round.
              this.color = this._generateRoundColor();
              this.player.score = this.ai.score = 0;
              this.player.speed += 0.5;
              this.ai.speed += 1;
              this.ball.speed += 1;
              this.round += 1;

          }
      }
      // Verifique para ver se IA venceu a partida. 
      else if (this.ai.score === rounds[this.round]) {
          this.over = true;
          setTimeout(function () { Pong.endGameMenu('Game Over!'); }, 1000);
      }
  },

  // Desenha os objetos para o elemento canvas.
  draw: function () {
      // Limpe o canvas.
      this.context.clearRect(
          0,
          0,
          this.canvas.width,
          this.canvas.height
      );

      // Configura o style de preenchimento para preto.
      this.context.fillStyle = this.color;

      // Desenha o background.
      this.context.fillRect(
          0,
          0,
          this.canvas.width,
          this.canvas.height
      );

      // Configura o estilo fill para branco (para remos e bola).
      this.context.fillStyle = '#ffffff';

      // Desenha o jogador
      this.context.fillRect(
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height
      );

      // Desenha a IA
      this.context.fillRect(
          this.ai.x,
          this.ai.y,
          this.ai.width,
          this.ai.height 
      );

      // Desenha a bola
      if (Pong._turnDelayIsOver.call(this)) {
          this.context.fillRect(
              this.ball.x,
              this.ball.y,
              this.ball.width,
              this.ball.height
          );
      }

      // Desenha a rede (linha no centro). 
      this.context.beginPath();
      this.context.setLineDash([7, 15]);
      this.context.moveTo((this.canvas.width / 2), this.canvas.height - 140);
      this.context.lineTo((this.canvas.width / 2), 140);
      this.context.lineWidth = 10;
      this.context.strokeStyle = '#ffffff';
      this.context.stroke();

      // Configura o canvas de fonte padrão e alinhe isso para o centro.
      this.context.font = '100px Courier New';
      this.context.textAlign = 'center';

      // Desenha o placar dos jogadores (esquerda).
      this.context.fillText(
          this.player.score.toString(),
          (this.canvas.width / 2) - 300,
          200
      );

      // Desenha a pontuação dos remos (direita).
      this.context.fillText(
          this.ai.score.toString(),
          (this.canvas.width / 2) + 300,
          200
      );

      // Muda o tamanho da fonte para o texto do placar central.
      this.context.font = '30px Courier New';

      // Desenha o placar vencedor (centro)
      this.context.fillText(
          'Round ' + (Pong.round + 1),
          (this.canvas.width / 2),
          35
      );

      // Muda o tamanho da fonte para o valor central do placar.
      this.context.font = '40px Courier';

      // Desenha o numero atual da rodada.
      this.context.fillText(
          rounds[Pong.round] ? rounds[Pong.round] : rounds[Pong.round - 1],
          (this.canvas.width / 2),
          100
      );
  },

  loop: function () {
      Pong.update();
      Pong.draw();

      // Se o jogo não acabou, desenha o próximo frame.
      if (!Pong.over) requestAnimationFrame(Pong.loop);
  },

  listen: function () {
      document.addEventListener('keydown', function (key) {
          // Controla o 'Pressione qualquer tecla para começar' função e começa o jogo.
          if (Pong.running === false) {
              Pong.running = true;
              window.requestAnimationFrame(Pong.loop);
          }

          // Controla a seta para cima e w key events.
          if (key.keyCode === 38 || key.keyCode === 87) Pong.player.move = direction.up;

          // Controla a seta para baixo e s key events.
          if (key.keyCode === 40 || key.keyCode === 83) Pong.player.move = direction.down;
      });

      // Para o jogador de mover quando não há teclas sendo pressionadas.
      document.addEventListener('keyup', function (key) { Pong.player.move = direction.idle; });
  },

  // Reseta a localização da bola, o jogador liga e configura um atrasado antes de cada round começar.
  _resetTurn: function(victor, loser) {
      this.ball = Ball.new.call(this, this.ball.speed);
      this.turn = loser;
      this.timer = (new Date()).getTime();

      victor.score++;
  },

  // Espera um delay para ter passado a cada rodada.
  _turnDelayIsOver: function() {
      return ((new Date()).getTime() - this.timer >= 1000);
  },

  // Seleciona uma cor aleatória como background de cada level/round.
  _generateRoundColor: function () {
      var newColor = colors[Math.floor(Math.random() * colors.length)];
      if (newColor === this.color) return Pong._generateRoundColor();
      return newColor;
  }
};

var Pong = Object.assign({}, Game);
Pong.initialize();