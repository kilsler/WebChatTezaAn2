package com.morozan_web_chat.web_chat.repository;

import com.morozan_web_chat.web_chat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE " +
            "(m.senderId = :userId AND m.recipientId = :recipientId) OR " +
            "(m.senderId = :recipientId AND m.recipientId = :userId) " +
            "ORDER BY m.timestamp ASC")
    List<Message> findMessagesBetweenUsers(@Param("userId") Long userId, @Param("recipientId") Long recipientId);
}
