import React, { useEffect, useRef, useState } from 'react';

const ShootingGame = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const gameStateRef = useRef({
    player: { x: 0, y: 0 },
    bullets: [],
    enemies: [],
    animationFrameId: null,
    lastEnemySpawn: 0,
    enemySpawnInterval: 2000,
  });

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    gameStateRef.current = {
      player: { x: 0, y: 0 },
      bullets: [],
      enemies: [],
      animationFrameId: null,
      lastEnemySpawn: 0,
      enemySpawnInterval: 2000,
    };
    gameLoop();
  };

  const handleClick = (e) => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gameStateRef.current.player = { x, y };

    gameStateRef.current.bullets.push({
      x: x,
      y: y,
      speed: 5,
      angle: Math.PI * 1.5,
    });
  };

  const spawnEnemy = () => {
    const canvas = canvasRef.current;
    const x = Math.random() * canvas.width;
    gameStateRef.current.enemies.push({
      x: x,
      y: 0,
      speed: 2,
    });
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gameState = gameStateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // プレイヤーの描画
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // 弾の更新と描画
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
      const bullet = gameState.bullets[i];
      bullet.y -= bullet.speed;
      
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fill();

      if (bullet.y < 0) {
        gameState.bullets.splice(i, 1);
      }
    }

    // 敵の生成
    const now = Date.now();
    if (now - gameState.lastEnemySpawn > gameState.enemySpawnInterval) {
      spawnEnemy();
      gameState.lastEnemySpawn = now;
    }

    // 敵の更新と描画
    let enemyToRemove = new Set();

    // 衝突判定（弾と敵）
    for (let i = 0; i < gameState.enemies.length; i++) {
      const enemy = gameState.enemies[i];
      enemy.y += enemy.speed;

      // 画面外に出た敵を削除対象に追加
      if (enemy.y > canvas.height) {
        enemyToRemove.add(i);
        continue;
      }

      // プレイヤーとの衝突判定
      const playerDx = gameState.player.x - enemy.x;
      const playerDy = gameState.player.y - enemy.y;
      const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
      
      if (playerDistance < 25) {
        setGameOver(true);
        return;
      }

      // 弾との衝突判定
      for (let j = gameState.bullets.length - 1; j >= 0; j--) {
        const bullet = gameState.bullets[j];
        const dx = bullet.x - enemy.x;
        const dy = bullet.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 18) {
          enemyToRemove.add(i);
          gameState.bullets.splice(j, 1);
          setScore(prev => prev + 100);
          break;
        }
      }

      // 敵の描画（削除対象でない場合のみ）
      if (!enemyToRemove.has(i)) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 削除対象の敵を配列から削除
    gameState.enemies = gameState.enemies.filter((_, index) => !enemyToRemove.has(index));

    if (!gameOver) {
      gameState.animationFrameId = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 800;
    canvas.height = 600;

    return () => {
      if (gameStateRef.current.animationFrameId) {
        cancelAnimationFrame(gameStateRef.current.animationFrameId);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-xl">Score: {score}</div>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="border-2 border-gray-300 cursor-crosshair"
      />
      {!gameStarted || gameOver ? (
        <button
          onClick={startGame}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {gameOver ? 'Retry' : 'Start Game'}
        </button>
      ) : null}
      {gameOver && (
        <div className="text-xl text-red-500">Game Over!</div>
      )}
    </div>
  );
};

export default ShootingGame;