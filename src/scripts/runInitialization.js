#!/usr/bin/env node

/**
 * 編譯初始化腳本並運行它
 * 這個腳本用於在不編譯整個專案的情況下運行初始化腳本
 */
require('ts-node').register();
require('./initialize/index');