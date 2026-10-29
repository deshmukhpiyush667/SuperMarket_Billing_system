package com.supermarket.billing.util;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class InvoiceNumberGenerator {

    private final AtomicInteger sequence = new AtomicInteger(1001);
    private String lastDate = "";

    public synchronized String generate() {
        String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        if (!currentDate.equals(lastDate)) {
            lastDate = currentDate;
            sequence.set(1001);
        }
        int nextSeq = sequence.getAndIncrement();
        return "INV-" + currentDate + "-" + nextSeq;
    }
}
