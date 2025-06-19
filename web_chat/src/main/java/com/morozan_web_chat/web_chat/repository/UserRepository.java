package com.morozan_web_chat.web_chat.repository;

import com.morozan_web_chat.web_chat.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
}