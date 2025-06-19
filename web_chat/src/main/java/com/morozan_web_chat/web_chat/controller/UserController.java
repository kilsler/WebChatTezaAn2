package com.morozan_web_chat.web_chat.controller;

import com.morozan_web_chat.web_chat.entity.User;
import com.morozan_web_chat.web_chat.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getUsers() {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        List<User> users = userRepository.findAll().stream()
                .filter(user -> !user.getUsername().equals(currentUsername))
                .toList();
        System.out.println("Returning users: " + users);
        return users;
    }
}
