import { Application } from '@nativescript/core';
import { MainView } from './views/MainView';

Application.run({
  create: () => {
    const page = new MainView();
    return page;
  },
});