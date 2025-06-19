package com.morozan_web_chat.web_chat.controller;

import com.morozan_web_chat.web_chat.entity.Message;
import com.morozan_web_chat.web_chat.repository.MessageRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import java.time.LocalDateTime;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final MessageRepository messageRepository;

    public ChatController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @MessageMapping("/sendMessage")
    @SendTo("/topic/messages")
    public Message sendMessage(Message message) {
        message.setTimestamp(LocalDateTime.now());
        messageRepository.save(message);
        return message;
    }
}
