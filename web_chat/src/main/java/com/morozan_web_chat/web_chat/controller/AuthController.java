package com.morozan_web_chat.web_chat.controller;


import com.morozan_web_chat.web_chat.entity.User;
import com.morozan_web_chat.web_chat.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.secret}")
    private String jwtSecret;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody User user) {
        user.setPassword(passwordEncoder.encode(user.getUsername()));
        userRepository.save(user);
        String token = generateJwtToken(user.getUsername());
        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        return response;
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody User user) {
        User existingUser = userRepository.findByUsername(user.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (passwordEncoder.matches(user.getPassword(), existingUser.getPassword())) {
            String token = generateJwtToken(user.getUsername());
            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            return response;
        }
        throw new RuntimeException("Invalid credentials");
    }

    @GetMapping("/current")
    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String generateJwtToken(String username) {
        return Jwts.builder()
                .subject(username)
                .signWith(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .compact();
    }
}