" Caterwaul filetype detector
" Append the lines below to ~/.vim/scripts.vim to enable Waul script filetype
" detection.

if did_filetype()
  finish
endif

if getline(1) =~ '^#!.*waul'
  setfiletype caterwaul
endif
