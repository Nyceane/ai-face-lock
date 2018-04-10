const int ledPin =  7;      // the number of the LED pin
int incomingByte = 0;   // for incoming serial data


void setup() {
  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);     // opens serial port, sets data rate to 9600 bps
}

void loop() {
          // send data only when you receive data:
        if (Serial.available() > 0) {
                // read the incoming byte:
                incomingByte = Serial.read();
           if(incomingByte == 48)
           {
            digitalWrite(ledPin, LOW);
           }
           else if(incomingByte == 49)
           {
            digitalWrite(ledPin, HIGH);
           }
                // say what you got:
                Serial.print("I received: ");
                Serial.println(incomingByte, DEC);
        }
}
