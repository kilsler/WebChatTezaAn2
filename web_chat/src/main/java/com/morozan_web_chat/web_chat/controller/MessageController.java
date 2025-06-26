package com.morozan_web_chat.web_chat.controller;

import com.morozan_web_chat.web_chat.entity.Message;
import com.morozan_web_chat.web_chat.repository.MessageRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageRepository messageRepository;

    public MessageController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping
    public List<Message> getMessagesBetweenUsers(@RequestParam Long userId, @RequestParam Long recipientId) {
        System.out.println("Fetching messages between userId: " + userId + " and recipientId: " + recipientId);
        List<Message> messages = messageRepository.findMessagesBetweenUsers(userId, recipientId);
        return messages;
    }
}
