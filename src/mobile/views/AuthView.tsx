import { Page, StackLayout, TextField, Button, Label } from '@nativescript/core';
import { AuthService } from '../auth/AuthService';

export class AuthView extends Page {
  private authService: AuthService;
  private emailField: TextField;
  private passwordField: TextField;

  constructor() {
    super();
    this.authService = new AuthService();
    this.createUI();
  }

  createUI() {
    const layout = new StackLayout();
    layout.className = "auth-container";

    // Logo
    const logo = new Image();
    logo.src = "~/assets/helmet-head-logo.png";
    logo.className = "auth-logo";

    // Title
    const title = new Label();
    title.text = "Road To Jansanity";
    title.className = "auth-title";

    // Email field
    this.emailField = new TextField();
    this.emailField.hint = "Email";
    this.emailField.className = "auth-input";
    this.emailField.keyboardType = "email";

    // Password field
    this.passwordField = new TextField();
    this.passwordField.hint = "Password";
    this.passwordField.secure = true;
    this.passwordField.className = "auth-input";

    // Sign In button
    const signInButton = new Button();
    signInButton.text = "Sign In";
    signInButton.className = "auth-button primary";
    signInButton.on('tap', () => this.signIn());

    // Sign Up button
    const signUpButton = new Button();
    signUpButton.text = "Create Account";
    signUpButton.className = "auth-button secondary";
    signUpButton.on('tap', () => this.signUp());

    // Add components
    layout.addChild(logo);
    layout.addChild(title);
    layout.addChild(this.emailField);
    layout.addChild(this.passwordField);
    layout.addChild(signInButton);
    layout.addChild(signUpButton);

    this.content = layout;
  }

  async signIn() {
    try {
      const email = this.emailField.text;
      const password = this.passwordField.text;

      if (!email || !password) {
        alert('Please enter email and password');
        return;
      }

      await this.authService.signIn(email, password);
      this.navigateToMain();
    } catch (error) {
      alert('Sign in failed: ' + error.message);
    }
  }

  async signUp() {
    try {
      const email = this.emailField.text;
      const password = this.passwordField.text;

      if (!email || !password) {
        alert('Please enter email and password');
        return;
      }

      await this.authService.signUp(email, password);
      alert('Account created! Please check your email to verify.');
    } catch (error) {
      alert('Sign up failed: ' + error.message);
    }
  }

  navigateToMain() {
    // Navigate to main app view
    this.frame.navigate({
      moduleName: 'views/MainView',
      clearHistory: true
    });
  }
}