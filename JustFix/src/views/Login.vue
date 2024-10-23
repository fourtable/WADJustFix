<style lang="css">
    @import '../../src/styles.css';
</style>

<template>
    <!-- Left Section with Background -->
    <div class="left-section">
            <!-- You can add content here if needed -->
        </div>

        <!-- Right Section with the login form -->
        <div class="right-section">
            <div class="card">
                <button class="btn google-btn d-flex align-items-center mx-auto" id="googleSignInBtn" style="padding: 8px 12px;">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" width="20">
                    Sign in with Google
                </button>
                <hr class="solid">
                <div class="card-divider">
                    <h4>Login to JustFix</h4>
                </div>
                <div class="card-section">
                    <form id="loginForm">
                        <div class="form-group mb-2">
                            <label for="email">Email</label>
                            <input type="email" id="email" class="form-control" placeholder="Enter your email" required>
                        </div>
                        
                        <div class="form-group mb-2">
                            <label for="password">Password</label>
                            <input type="password" id="password" class="form-control" placeholder="Enter your password" required>
                        </div>
                        
                        <!-- Only for the "Remember me" checkbox -->
                        <div class="form-group mb-2 d-flex justify-content-between">
                            <div class="form-check d-inline-flex align-items-center">
                                <input type="checkbox" id="rememberMe" class="form-check-input me-2">
                                <label for="rememberMe" class="form-check-label mb-0" style="padding-top: 5px;">Remember me</label>
                            </div>
                            <a href="#" id="forgotPassword" class="ms-auto d-inline-flex align-items-center" style="text-decoration: none; color: black; padding-top: 5px;">Forgot Password?</a>
                        </div>
                        <br>
                        <button type="submit" class="button">Login</button>
                    </form>
                    <div style="text-align: center; padding-top: 10px;">
                    <span>Don't have an account? <a href="register.html" style="text-decoration: none; color: black; font-weight: bolder;">Register</a></span></div>
                    <p id="errorMessage" style="color: red;"></p>
                </div>
            </div>
        </div>
</template>