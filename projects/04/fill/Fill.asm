// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/04/Fill.asm

// Runs an infinite loop that listens to the keyboard input.
// When a key is pressed (any key), the program blackens the screen,
// i.e. writes "black" in every pixel;
// the screen should remain fully black as long as the key is pressed. 
// When no key is pressed, the program clears the screen, i.e. writes
// "white" in every pixel;
// the screen should remain fully clear as long as no key is pressed.

(LOOP)
  @SCREEN
  D=A // D = SCREEN address
  @R0
  M=D // R0 = SCREEN address

  @KBD
  D=M // D = key code
  @WHITE
  D;JEQ // if D === 0 jump to WHITE

(BLACK)
  @R0
  A=M
  M=-1
  D=A+1 // D = R0 + 1
  @R0
  M=D // R0 = R0 + 1

  @KBD
  D=D-A
  @BLACK
  D;JLT // if D < 0 jump to BLACK

  @LOOP
  0;JMP // infinite loop

(WHITE)
  @R0
  A=M 
  M=0 // R0 = 0
  D=A+1  
  @R0
  M=D

  @KBD
  D=D-A // D = D - key code
  @WHITE
  D;JLT // if D < 0 jump to WHITE

  @LOOP
  0;JMP // infinite loop

