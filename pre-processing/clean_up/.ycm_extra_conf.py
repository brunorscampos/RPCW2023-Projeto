def Settings(** kwargs) -> dict:

    return {
        'flags': [
            '-Wall',
            '-Wextra',
            '-Wsign-conversion',
            '-pedantic-errors',
            '-Isrc',
            '-Ilib/tiny_obj_loader/include',
            '-Ilib/nlohmann/include',
            '-Ilib/regex/include',
            '-std=c++20'
        ]
    }
