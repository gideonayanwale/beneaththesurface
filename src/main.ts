import Phaser from 'phaser';
import { GameConfig } from './config';
import { Preloader } from './scenes/Preloader';
import { MainMenu } from './scenes/MainMenu';
import { GameScene } from './scenes/GameScene';
import { GameOver } from './scenes/GameOver';
import { Instructions } from './scenes/Instructions';
import { HUD } from './scenes/HUD';

const config: Phaser.Types.Core.GameConfig = {
    ...GameConfig,
    scene: [Preloader, MainMenu, GameScene, HUD, GameOver, Instructions],
};

new Phaser.Game(config);
