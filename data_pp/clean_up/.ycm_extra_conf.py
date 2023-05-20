def Settings(** kwargs) -> dict:

    return {
        'flags': [
            '-Wall',
            '-Wextra',
            '-Wsign-conversion',
            '-pedantic-errors',
            '-Iinclude',
            '-Ilib/tiny_obj_loader/include',
            '-Ilib/nlohmann/include',
            '-std=c++20'
        ]
    }
