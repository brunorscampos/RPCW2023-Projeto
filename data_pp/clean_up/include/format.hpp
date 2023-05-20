#ifndef FORMAT_HPP
#define FORMAT_HPP

#include <stdexcept>
#include <string>
#include <memory>

template<typename... A>
static
std::string string_format(char const* const fmt_str, A&&... args){

    int const num_of_chars {std::snprintf(nullptr, 0, fmt_str, args...) + 1};
    if(num_of_chars < 0)
        throw std::runtime_error{"Error formatting string"};

    size_t const length {static_cast<size_t>(num_of_chars)};
    std::unique_ptr<char[]> buffer {std::make_unique<char[]>(length)};

    std::snprintf(buffer.get(), length, fmt_str, args...);
    return std::string{buffer.get()};
}

template<typename... A>
static
std::string string_format(std::string const& fmt_str, A&&... args){
    return string_format(fmt_str.c_str(), args...);
}

#endif //FORMAT_HPP
