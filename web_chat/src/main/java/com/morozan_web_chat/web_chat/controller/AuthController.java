package com.morozan_web_chat.web_chat.controller;

import com.morozan_web_chat.web_chat.entity.User;
import com.morozan_web_chat.web_chat.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public User login(@RequestBody User user) {
        String username = user.getUsername();
        System.out.println("Login attempt for username: " + username);
        return userRepository.findByUsername(username)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setUsername(username);
                    return userRepository.save(newUser);
                });
    }

    @GetMapping("/current")
    public User getCurrentUser(@RequestParam String username) {
        System.out.println("Fetching current user: " + username);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}