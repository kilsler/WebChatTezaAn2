package com.morozan_web_chat.web_chat.repository;

import com.morozan_web_chat.web_chat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {
}
